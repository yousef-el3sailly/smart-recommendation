import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserLayout } from '@/components/layout/UserLayout';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { SeoHead } from '@/components/SeoHead';

const Cart = () => {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <UserLayout>
        <SeoHead title={t('nav.cart')} />
        <div className="container py-16 text-center space-y-4">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">{t('cart.empty')}</h1>
          <p className="text-muted-foreground">{t('cart.emptyDesc')}</p>
          <Button asChild><Link to="/products">{t('home.browseProducts')}</Link></Button>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <SeoHead title={t('nav.cart')} />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">{t('cart.title', { count: totalItems })}</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.product.id}>
                <CardContent className="p-4 flex gap-4">
                  <div className="w-24 h-24 rounded-md bg-muted overflow-hidden flex-shrink-0">
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">{t('card.noImage')}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.product.id}`} className="font-semibold hover:text-primary line-clamp-1">
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{item.product.category}</p>
                    <p className="text-lg font-bold text-primary mt-1">{item.product.price.toLocaleString()} EGP</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-bold">{t('cart.summary')}</h2>
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="truncate me-2">{item.product.name} × {item.quantity}</span>
                      <span>{(item.product.price * item.quantity).toLocaleString()} EGP</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 flex justify-between font-bold text-lg">
                  <span>{t('cart.total')}</span>
                  <span>{totalPrice.toLocaleString()} EGP</span>
                </div>
                <Button asChild className="w-full" size="lg">
                  <Link to="/checkout">{t('cart.checkout')}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default Cart;
