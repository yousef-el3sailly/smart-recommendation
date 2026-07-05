import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserLayout } from '@/components/layout/UserLayout';
import { useProduct } from '@/hooks/useProducts';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useIsFavorite, useToggleFavorite } from '@/hooks/useFavorites';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, ArrowLeft, Heart, ShoppingCart, Minus, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SeoHead } from '@/components/SeoHead';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id!);
  const { user } = useAuth();
  const { addItem } = useCart();
  const { data: isFavorite } = useIsFavorite(id!);
  const toggleFavorite = useToggleFavorite();
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (user && id) {
      supabase.rpc('upsert_recently_viewed', { p_user_id: user.id, p_product_id: id });
    }
  }, [user, id]);

  if (isLoading) {
    return (
      <UserLayout>
        <div className="container py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  if (!product) {
    return (
      <UserLayout>
        <SeoHead title={t('productDetail.notFound')} />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('productDetail.notFound')}</h1>
          <Button asChild><Link to="/products">{t('home.browseProducts')}</Link></Button>
        </div>
      </UserLayout>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast({ title: t('card.addedToCart', { name: product.name }) });
  };

  return (
    <UserLayout>
      <SeoHead title={product.name} description={product.description ?? undefined} />
      <div className="container py-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/products"><ArrowLeft className="me-2 h-4 w-4" />{t('productDetail.back')}</Link>
        </Button>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="object-cover w-full h-full" />
            ) : (
              <span className="text-muted-foreground">{t('card.noImage')}</span>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{product.category}</p>
              <h1 className="text-3xl font-bold">{product.name}</h1>
            </div>
            {product.rating != null && (
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-star text-star" />
                <span className="font-medium">{t('productDetail.ratingOf', { rating: product.rating })}</span>
              </div>
            )}
            <p className="text-3xl font-bold text-primary">{product.price.toLocaleString()} EGP</p>
            {product.description && (
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            )}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 pt-4">
              <div className="flex items-center gap-2 border rounded-md px-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(quantity + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleAddToCart} className="flex-1" size="lg">
                <ShoppingCart className="me-2 h-5 w-5" />
                {t('productDetail.addToCart')}
              </Button>
              {user && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => toggleFavorite.mutate({ productId: product.id, isFavorite: !!isFavorite })}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-destructive text-destructive' : ''}`} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default ProductDetail;
