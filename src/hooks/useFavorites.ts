import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useFavorites() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('*, products(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useIsFavorite(productId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['favorite', user?.id, productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user!.id)
        .eq('product_id', productId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!productId,
  });
}

export function useToggleFavorite() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, isFavorite }: { productId: string; isFavorite: boolean }) => {
      if (!user) throw new Error('Must be logged in');
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: productId });
        if (error) throw error;
      }
    },
    onSuccess: (_, { productId }) => {
      qc.invalidateQueries({ queryKey: ['favorites'] });
      qc.invalidateQueries({ queryKey: ['favorite', user?.id, productId] });
    },
  });
}
