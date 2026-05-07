import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, Enums } from '@/integrations/supabase/types';
import { scoreProduct, getBudgetBounds } from '@/lib/recommendations';

export type Product = Tables<'products'>;
type Profile = Tables<'profiles'>;

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });
}

export function usePopularProducts() {
  return useQuery({
    queryKey: ['popular-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('popularity_score', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data as Product[];
    },
  });
}

/**
 * Trending = products with most clicks in the last 14 days, joined to product rows.
 */
export function useTrendingProducts() {
  return useQuery({
    queryKey: ['trending-products'],
    queryFn: async () => {
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: clicks, error: clickErr } = await supabase
        .from('product_clicks')
        .select('product_id')
        .gte('created_at', since);
      if (clickErr) throw clickErr;

      const counts = new Map<string, number>();
      (clicks ?? []).forEach((c) => counts.set(c.product_id, (counts.get(c.product_id) ?? 0) + 1));

      const topIds = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([id]) => id);

      if (topIds.length === 0) {
        // Fallback to popularity if there are no recent clicks
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('popularity_score', { ascending: false })
          .limit(8);
        if (error) throw error;
        return data as Product[];
      }

      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .in('id', topIds);
      if (error) throw error;

      const sorted = (products as Product[]).sort(
        (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0)
      );
      return sorted;
    },
  });
}

/**
 * Best for Your Budget — products within the user's budget band, ranked by rating + popularity.
 */
export function useBudgetProducts(budget: Enums<'budget_range'> | null | undefined) {
  return useQuery({
    queryKey: ['budget-products', budget],
    queryFn: async () => {
      const bounds = getBudgetBounds(budget);
      if (!bounds) return [] as Product[];
      const max = bounds.max === Number.POSITIVE_INFINITY ? 10_000_000 : bounds.max;
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .gte('price', bounds.min)
        .lte('price', max)
        .order('rating', { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data as Product[])
        .sort(
          (a, b) =>
            (Number(b.rating ?? 0) * 2 + (b.popularity_score ?? 0)) -
            (Number(a.rating ?? 0) * 2 + (a.popularity_score ?? 0))
        )
        .slice(0, 8);
    },
    enabled: !!budget,
  });
}

/**
 * Personalized "Recommended for You" — pulls a wide candidate pool and ranks
 * client-side using the v2 scoring formula. Combines faculty, category,
 * budget, usage, popularity, rating, and behavior history (clicks, cart adds, purchases).
 */
export function usePersonalizedRecommendations(profile: Profile | null | undefined) {
  return useQuery({
    queryKey: [
      'personalized-recommendations',
      profile?.faculty,
      profile?.budget_range,
      profile?.usage_type,
      profile?.preferred_categories,
      profile?.brand_preference,
    ],
    queryFn: async () => {
      // Pull a generous candidate pool. Even without strong filters, scoring will rank well.
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .limit(80);
      if (error) throw error;
      const pool = (products ?? []) as Product[];
      if (pool.length === 0) return [] as Product[];

      const ids = pool.map((p) => p.id);

      // Fetch behavior signals in parallel
      const [clicksRes, cartRes, purchasesRes] = await Promise.all([
        supabase.from('product_clicks').select('product_id').in('product_id', ids),
        supabase.from('cart_events').select('product_id').in('product_id', ids),
        supabase.from('order_items').select('product_id, quantity').in('product_id', ids),
      ]);

      const clickCounts: Record<string, number> = {};
      (clicksRes.data ?? []).forEach((c) => {
        clickCounts[c.product_id] = (clickCounts[c.product_id] ?? 0) + 1;
      });
      const cartCounts: Record<string, number> = {};
      (cartRes.data ?? []).forEach((c) => {
        cartCounts[c.product_id] = (cartCounts[c.product_id] ?? 0) + 1;
      });
      const purchaseCounts: Record<string, number> = {};
      (purchasesRes.data ?? []).forEach((p: any) => {
        purchaseCounts[p.product_id] = (purchaseCounts[p.product_id] ?? 0) + (p.quantity ?? 1);
      });

      const ctx = {
        faculty: profile?.faculty,
        budget: profile?.budget_range,
        usage: profile?.usage_type,
        preferredCategories: profile?.preferred_categories ?? [],
        brandPreference: profile?.brand_preference ?? null,
      };

      const scored = pool.map((p) => ({
        product: p,
        score: scoreProduct(
          {
            tags: p.tags,
            category: p.category,
            price: p.price,
            popularity_score: p.popularity_score,
            rating: p.rating != null ? Number(p.rating) : null,
            clicks: clickCounts[p.id] ?? 0,
            cartAdds: cartCounts[p.id] ?? 0,
            purchases: purchaseCounts[p.id] ?? 0,
          },
          ctx
        ),
      }));

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, 8).map((s) => s.product);
    },
  });
}

/**
 * Top picks for the user's faculty — same scoring engine but boosted toward faculty-only signal.
 * Implementation: filter pool to products whose tags or category match the faculty mapping,
 * then rank by the v2 formula.
 */
export function useFacultyTopPicks(profile: Profile | null | undefined) {
  return useQuery({
    queryKey: ['faculty-top-picks', profile?.faculty],
    queryFn: async () => {
      const { data: products, error } = await supabase.from('products').select('*').limit(80);
      if (error) throw error;
      const pool = (products ?? []) as Product[];

      const ctx = {
        faculty: profile?.faculty,
        // Intentionally omit budget/usage so this section is faculty-pure
        preferredCategories: [],
        brandPreference: null,
      };

      const scored = pool
        .map((p) => ({
          product: p,
          score: scoreProduct(
            {
              tags: p.tags,
              category: p.category,
              price: p.price,
              popularity_score: p.popularity_score,
              rating: p.rating != null ? Number(p.rating) : null,
            },
            ctx
          ),
        }))
        // Only include things with at least some faculty signal
        .filter((s) => s.score > 0);

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, 8).map((s) => s.product);
    },
    enabled: !!profile?.faculty && profile.faculty !== 'Other',
  });
}

export function useRecentlyViewed(userId: string | undefined) {
  return useQuery({
    queryKey: ['recently-viewed', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recently_viewed')
        .select('*, products(*)')
        .eq('user_id', userId!)
        .order('viewed_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
