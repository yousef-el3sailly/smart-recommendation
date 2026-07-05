import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

const USAGE_TAG_KEYS = ['programming','gaming','design','study','note-taking','high-performance','portable','long-battery'];

const ProductCardImpl: React.FC<ProductCardProps> = ({ product, recommendationReason, trackingSource }) => {
  const { user, profile } = useAuth();
  const { addItem } = useCart();
  const { data: isFavorite } = useIsFavorite(product.id);
  const toggleFavorite = useToggleFavorite();
  const { t } = useTranslation();

  const stock = product.stock ?? 0;
  const outOfStock = stock <= 0;
  const lowStock = stock > 0 && stock <= 5;

  const smartLabel = useMemo<string | null>(() => {
    const tags = product.tags ?? [];
    const facultyTags = new Set(getRecommendedTags(profile?.faculty));

    if (profile?.faculty && profile.faculty !== 'Other' && tags.some((t2) => facultyTags.has(t2))) {
      return t('smartLabel.bestFor', { faculty: t(`faculties.${profile.faculty}`, { defaultValue: getFacultyLabel(profile.faculty) }) });
    }
    if (profile?.budget_range) {
      const b = budgetRanges[profile.budget_range];
      if (b && product.price >= b.min && product.price <= b.max) {
        return t('smartLabel.matchesBudget');
      }
    }
    if (profile?.usage_type) {
      const key = profile.usage_type as string;
      if (USAGE_TAG_KEYS.includes(key) && (tags.includes(key) || tags.some((tg) => USAGE_TAG_KEYS.includes(tg)))) {
        return t(`smartLabel.${key}` as any);
      }
    }
    for (const tg of tags) {
      if (USAGE_TAG_KEYS.includes(tg)) return t(`smartLabel.${tg}` as any);
    }
    if ((product.rating ?? 0) >= 4.5) return t('smartLabel.popular');
    if (product.price <= 15000) return t('smartLabel.budgetFriendly');
    return null;
  }, [product.tags, product.price, product.rating, profile?.faculty, profile?.budget_range, profile?.usage_type, t]);

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
      toast.error(t('card.outOfStockToast'));
      return;
    }
    addItem(product);
    toast.success(t('card.addedToCart', { name: product.name }));
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
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">{t('card.noImage')}</div>
          )}

          {smartLabel && (
            <div className="absolute top-2 start-2 max-w-[75%]">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/95 text-primary-foreground text-[10px] font-semibold px-2.5 py-1 shadow-md backdrop-blur-sm">
                <Sparkles className="h-3 w-3" />
                <span className="truncate">{smartLabel}</span>
              </span>
            </div>
          )}

          {outOfStock && (
            <Badge variant="destructive" className="absolute bottom-2 start-2 text-[10px]">{t('card.outOfStock')}</Badge>
          )}

          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 end-2 bg-background/85 backdrop-blur-sm hover:bg-background h-9 w-9 rounded-full shadow-sm active:scale-90 transition-transform"
              onClick={handleFavorite}
              aria-label={isFavorite ? t('card.removeFromWishlist') : t('card.addToWishlist')}
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
            {outOfStock ? t('card.outOfStock') : lowStock ? t('card.onlyLeft', { count: stock }) : t('card.inStock', { count: stock })}
          </p>

          {recommendationReason && (
            <div className="text-[11px] sm:text-xs text-primary mt-2.5 bg-primary/5 rounded-lg px-2.5 py-1.5 border border-primary/10 line-clamp-2">
              <span className="font-semibold">{t('card.why')} </span>{recommendationReason}
            </div>
          )}

          <div className="flex-1" />

          <Button
            size="sm"
            className="w-full mt-3.5 h-10 font-semibold rounded-xl shadow-md hover:shadow-lg active:scale-[0.97] transition-all duration-200"
            onClick={handleAddToCart}
            disabled={outOfStock}
          >
            <ShoppingCart className="me-2 h-4 w-4" />
            {outOfStock ? t('card.unavailable') : t('card.addToCart')}
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
};

export const ProductCard = memo(ProductCardImpl);
