import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { UserLayout } from '@/components/layout/UserLayout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2 } from 'lucide-react';

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{ id: string; items: typeof items; total: number } | null>(null);
  const hasInsufficientStock = items.some(i => i.quantity > (i.product.stock ?? 0));

  if (!user) return <Navigate to="/auth" />;
  if (items.length === 0 && !orderPlaced) return <Navigate to="/cart" />;

  if (orderPlaced && confirmedOrder) {
    return (
      <UserLayout>
        <div className="container max-w-2xl py-12">
          <Card className="text-center">
            <CardHeader>
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-2" />
              <CardTitle className="text-2xl">Order Placed Successfully!</CardTitle>
              <p className="text-sm text-muted-foreground">
                Order <span className="font-mono font-semibold">#{confirmedOrder.id.slice(0, 8).toUpperCase()}</span> · A confirmation has been sent to your email.
              </p>
            </CardHeader>
            <CardContent className="text-left space-y-3">
              <div className="border rounded-md p-4 space-y-2">
                {confirmedOrder.items.map((it) => (
                  <div key={it.product.id} className="flex justify-between text-sm">
                    <span className="truncate pr-2">{it.product.name} × {it.quantity}</span>
                    <span className="whitespace-nowrap">{(it.product.price * it.quantity).toLocaleString()} EGP</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>{confirmedOrder.total.toLocaleString()} EGP</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button onClick={() => navigate('/orders')}>View Orders</Button>
                <Button variant="outline" onClick={() => navigate('/products')}>Continue Shopping</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    );
  }

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      toast({ title: 'Please enter a shipping address', variant: 'destructive' });
      return;
    }
    setPlacing(true);
    try {
      const { data, error } = await supabase.rpc('place_order', {
        p_user_id: user.id,
        p_total: totalPrice,
        p_shipping_address: address,
        p_payment_method: paymentMethod,
        p_items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })) as any,
      });
      if (error) throw error;

      const snapshot = { id: String(data), items: [...items], total: totalPrice };
      clearCart();
      setConfirmedOrder(snapshot);
      setOrderPlaced(true);
      toast({ title: 'Order placed successfully!', description: `Order #${snapshot.id.slice(0, 8).toUpperCase()}` });
    } catch (err: any) {
      toast({ title: 'Failed to place order', description: err.message, variant: 'destructive' });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <UserLayout>
      <div className="container max-w-3xl py-8">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Shipping Address</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter your full shipping address..."
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Payment Method</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash_on_delivery" id="cod" />
                  <Label htmlFor="cod">Cash on Delivery</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="simulated_card" id="card" />
                  <Label htmlFor="card">Card Payment (Simulated)</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {items.map(item => {
                const stock = item.product.stock ?? 0;
                const insufficient = item.quantity > stock;
                return (
                  <div key={item.product.id} className="flex justify-between text-sm gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="block truncate">{item.product.name} × {item.quantity}</span>
                      {insufficient && (
                        <span className="text-xs text-destructive">Only {stock} in stock</span>
                      )}
                    </div>
                    <span className="whitespace-nowrap">{(item.product.price * item.quantity).toLocaleString()} EGP</span>
                  </div>
                );
              })}
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{totalPrice.toLocaleString()} EGP</span>
              </div>
            </CardContent>
          </Card>

          {hasInsufficientStock && (
            <p className="text-sm text-destructive text-center">
              Some items exceed available stock. Please update your cart before placing the order.
            </p>
          )}

          <Button
            onClick={handlePlaceOrder}
            disabled={placing || hasInsufficientStock}
            className="w-full"
            size="lg"
          >
            {placing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Placing Order...</>
            ) : (
              `Place Order - ${totalPrice.toLocaleString()} EGP`
            )}
          </Button>
        </div>
      </div>
    </UserLayout>
  );
};

export default Checkout;
