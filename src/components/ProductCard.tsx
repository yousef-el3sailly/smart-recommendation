import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Heart, ShoppingCart, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useIsFavorite, useToggleFavorite } from '@/hooks/useFavorites';
import type { Product } from '@/hooks/useProducts';
import { trackProductClick } from '@/lib/trackClick';
import { supabase } from '@/integrations/supabase/client';
import { budgetRanges, getRecommendedTags, getFacultyLabel } from '@/lib/recommendations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  recommendationReason?: string;
  trackingSource?: string;
}

const USAGE_LABELS: Record<string, string> = {
  programming: 'Recommended for Programming',
  gaming: 'Great for Gaming',
  design: 'Perfect for Design',
  study: 'Ideal for Studying',
  'note-taking': 'Great for Note-Taking',
  'high-performance': 'High-Performance Pick',
  portable: 'Highly Portable',
  'long-battery': 'All-Day Battery',
};

const ProductCardImpl: React.FC<ProductCardProps> = ({ product, recommendationReason, trackingSource }) => {
  const { user, profile } = useAuth();
  const { addItem } = useCart();
  const { data: isFavorite } = useIsFavorite(product.id);
  const toggleFavorite = useToggleFavorite();

  const stock = product.stock ?? 0;
  const outOfStock = stock <= 0;
  const lowStock = stock > 0 && stock <= 5;

  // Smart, personalized label (one strongest signal)
  const smartLabel = useMemo<string | null>(() => {
    const tags = product.tags ?? [];
    const facultyTags = new Set(getRecommendedTags(profile?.faculty));

    // 1) Faculty match
    if (profile?.faculty && profile.faculty !== 'Other' && tags.some((t) => facultyTags.has(t))) {
      return `Best for ${getFacultyLabel(profile.faculty)}`;
    }
    // 2) Budget match
    if (profile?.budget_range) {
      const b = budgetRanges[profile.budget_range];
      if (b && product.price >= b.min && product.price <= b.max) {
        return 'Matches your Budget';
      }
    }
    // 3) Usage-based label
    if (profile?.usage_type) {
      const usageLabel = USAGE_LABELS[profile.usage_type as string];
      if (usageLabel && tags.some((t) => t === profile.usage_type || USAGE_LABELS[t])) {
        return usageLabel;
      }
    }
    // 4) Tag-driven fallback
    for (const t of tags) {
      if (USAGE_LABELS[t]) return USAGE_LABELS[t];
    }
    // 5) Popularity / rating fallback
    if ((product.rating ?? 0) >= 4.5) return 'Popular among students';
    if (product.price <= 15000) return 'Budget Friendly';
    return null;
  }, [product.tags, product.price, product.rating, profile?.faculty, profile?.budget_range, profile?.usage_type]);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    toggleFavorite.mutate({ productId: product.id, isFavorite: !!isFavorite });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) {
      toast.error('This product is currently out of stock');
      return;
    }
    addItem(product);
    toast.success(`${product.name} added to cart`);
    void supabase.from('cart_events').insert({
      user_id: user?.id ?? null,
      product_id: product.id,
      quantity: 1,
    });
  };

  const handleCardClick = () => {
    trackProductClick(product.id, {
      userId: user?.id ?? null,
      faculty: profile?.faculty ?? null,
      source: trackingSource ?? 'card',
    });
  };

  return (
    <Link to={`/products/${product.id}`} onClick={handleCardClick} className="block h-full">
      <Card className={cn(
        "overflow-hidden rounded-2xl border shadow-sm hover:shadow-xl active:scale-[0.985] hover:-translate-y-0.5 transition-all duration-300 ease-out group h-full flex flex-col bg-card",
        recommendationReason
          ? "border-primary/40 ring-1 ring-primary/20 shadow-[0_0_0_1px_hsl(var(--primary)/0.15),0_8px_24px_-12px_hsl(var(--primary)/0.35)]"
          : "border-border/60"
      )}>
        <div className="aspect-[4/3] sm:aspect-square w-full bg-muted overflow-hidden relative">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">No Image</div>
          )}

          {smartLabel && (
            <div className="absolute top-2 left-2 max-w-[75%]">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/95 text-primary-foreground text-[10px] font-semibold px-2.5 py-1 shadow-md backdrop-blur-sm">
                <Sparkles className="h-3 w-3" />
                <span className="truncate">{smartLabel}</span>
              </span>
            </div>
          )}

          {outOfStock && (
            <Badge variant="destructive" className="absolute bottom-2 left-2 text-[10px]">Out of stock</Badge>
          )}

          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-background/85 backdrop-blur-sm hover:bg-background h-9 w-9 rounded-full shadow-sm active:scale-90 transition-transform"
              onClick={handleFavorite}
              aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`h-4 w-4 transition-colors ${isFavorite ? 'fill-destructive text-destructive' : ''}`} />
            </Button>
          )}
        </div>

        <CardContent className="p-3 sm:p-4 flex flex-col flex-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-medium">{product.category}</p>
          <h3 className="font-semibold text-sm sm:text-[15px] leading-snug line-clamp-2 mt-1 mb-2.5 min-h-[2.5rem]">
            {product.name}
          </h3>

          <div className="flex items-end justify-between gap-2">
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-extrabold text-primary tracking-tight leading-none">
                {product.price.toLocaleString()}
              </span>
              <span className="text-[11px] font-semibold text-primary/80">EGP</span>
            </div>
            {product.rating != null && (
              <div className="flex items-center gap-1 text-xs font-medium text-foreground/80">
                <Star className="h-3.5 w-3.5 fill-star text-star" />
                <span>{product.rating}</span>
              </div>
            )}
          </div>

          <p className={`text-[11px] mt-2 font-medium ${outOfStock ? 'text-destructive' : lowStock ? 'text-orange-600' : 'text-muted-foreground'}`}>
            {outOfStock ? 'Out of stock' : lowStock ? `Only ${stock} left` : `${stock} in stock`}
          </p>

          {recommendationReason && (
            <div className="text-[11px] sm:text-xs text-primary mt-2.5 bg-primary/5 rounded-lg px-2.5 py-1.5 border border-primary/10 line-clamp-2">
              <span className="font-semibold">Why: </span>{recommendationReason}
            </div>
          )}

          <div className="flex-1" />

          <Button
            size="sm"
            className="w-full mt-3.5 h-10 font-semibold rounded-xl shadow-md hover:shadow-lg active:scale-[0.97] transition-all duration-200"
            onClick={handleAddToCart}
            disabled={outOfStock}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {outOfStock ? 'Unavailable' : 'Add to Cart'}
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
};

export const ProductCard = memo(ProductCardImpl);
