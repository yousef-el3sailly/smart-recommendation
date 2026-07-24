import React, { useEffect, useMemo, useState } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Star, ArrowLeft, Heart, ShoppingCart, Minus, Plus, Cpu, HardDrive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SeoHead } from '@/components/SeoHead';
import {
  RAM_OPTIONS,
  SSD_OPTIONS,
  DEFAULT_RAM,
  DEFAULT_SSD,
  isCustomizable,
  type CartCustomization,
} from '@/lib/customization';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id!);
  const { user } = useAuth();
  const { addItem } = useCart();
  const { data: isFavorite } = useIsFavorite(id!);
  const toggleFavorite = useToggleFavorite();
  const [quantity, setQuantity] = useState(1);
  const [ramValue, setRamValue] = useState(DEFAULT_RAM.value);
  const [ssdValue, setSsdValue] = useState(DEFAULT_SSD.value);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (user && id) {
      supabase.rpc('upsert_recently_viewed', { p_user_id: user.id, p_product_id: id });
    }
  }, [user, id]);

  const customizable = isCustomizable(product?.category);
  const ram = useMemo(() => RAM_OPTIONS.find(o => o.value === ramValue) ?? DEFAULT_RAM, [ramValue]);
  const ssd = useMemo(() => SSD_OPTIONS.find(o => o.value === ssdValue) ?? DEFAULT_SSD, [ssdValue]);
  const extra = customizable ? ram.extra + ssd.extra : 0;
  const finalPrice = (product?.price ?? 0) + extra;

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
    const customization: CartCustomization | undefined = customizable
      ? { ram: ram.value, ssd: ssd.value, ramExtra: ram.extra, ssdExtra: ssd.extra }
      : undefined;
    addItem(product, quantity, customization);
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
            <p
              key={finalPrice}
              className="text-3xl font-bold text-primary transition-all duration-300 animate-in fade-in slide-in-from-bottom-1"
            >
              {finalPrice.toLocaleString()} EGP
            </p>
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

            {customizable && (
              <Card className="border-primary/30">
                <CardContent className="p-4 sm:p-5 space-y-5">
                  <h2 className="text-lg font-bold">{t('customize.title')}</h2>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Cpu className="h-4 w-4 text-primary" />
                      {t('customize.ram')}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {RAM_OPTIONS.map(opt => {
                        const active = ramValue === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setRamValue(opt.value)}
                            className={`rounded-md border p-2 text-sm text-center transition-all active:scale-95 ${
                              active
                                ? 'border-primary bg-primary/10 ring-2 ring-primary/40'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="font-semibold">{opt.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {opt.extra === 0 ? '—' : t('customize.extraSuffix', { amount: opt.extra.toLocaleString() })}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <HardDrive className="h-4 w-4 text-primary" />
                      {t('customize.ssd')}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SSD_OPTIONS.map(opt => {
                        const active = ssdValue === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setSsdValue(opt.value)}
                            className={`rounded-md border p-2 text-sm text-center transition-all active:scale-95 ${
                              active
                                ? 'border-primary bg-primary/10 ring-2 ring-primary/40'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="font-semibold">{opt.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {opt.extra === 0 ? '—' : t('customize.extraSuffix', { amount: opt.extra.toLocaleString() })}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-md bg-muted/60 p-3 space-y-1.5 text-sm">
                    <div className="font-semibold mb-1">{t('customize.summary')}</div>
                    <div className="flex justify-between"><span>{t('customize.ram')}</span><span className="font-medium">{ram.label}</span></div>
                    <div className="flex justify-between"><span>{t('customize.ssd')}</span><span className="font-medium">{ssd.label}</span></div>
                    <div className="flex justify-between"><span>{t('customize.basePrice')}</span><span>{product.price.toLocaleString()} EGP</span></div>
                    <div className="flex justify-between"><span>{t('customize.additional')}</span><span>+{extra.toLocaleString()} EGP</span></div>
                    <div className="flex justify-between border-t pt-1.5 mt-1 font-bold">
                      <span>{t('customize.finalPrice')}</span>
                      <span className="text-primary">{finalPrice.toLocaleString()} EGP</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
