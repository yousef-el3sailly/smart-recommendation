import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { UserLayout } from '@/components/layout/UserLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserOrders } from '@/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const Orders = () => {
  const { user, loading } = useAuth();
  const { data: orders, isLoading } = useUserOrders();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;

  const handleCancel = async (orderId: string) => {
    setCancellingId(orderId);
    const { error } = await supabase.rpc('cancel_order', { p_order_id: orderId });
    setCancellingId(null);
    if (error) {
      toast({ title: 'Failed to cancel order', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Order cancelled', description: 'Stock has been restored.' });
      qc.invalidateQueries({ queryKey: ['user-orders'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    }
  };

  return (
    <UserLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Package className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">No orders yet</h2>
            <p className="text-muted-foreground">Start shopping to see your orders here.</p>
            <Button asChild><Link to="/products">Browse Products</Link></Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const canCancel = order.status === 'pending';
              const isDelivered = order.status === 'delivered';
              return (
                <Card key={order.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-base">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </CardTitle>
                      <Badge className={statusColor[order.status] || ''}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                      {' · '}{order.payment_method === 'cash_on_delivery' ? 'Cash on Delivery' : 'Card Payment'}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.products?.name ?? 'Product'} × {item.quantity}</span>
                          <span>{(item.price * item.quantity).toLocaleString()} EGP</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t mt-3 pt-3 flex justify-between font-bold">
                      <span>Total</span>
                      <span>{Number(order.total_price).toLocaleString()} EGP</span>
                    </div>
                    <div className="mt-3 flex justify-end">
                      {canCancel ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={cancellingId === order.id}>
                              {cancellingId === order.id ? (
                                <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Cancelling...</>
                              ) : 'Cancel Order'}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will cancel your order and restore the product stock. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Order</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleCancel(order.id)}>
                                Yes, Cancel Order
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : isDelivered ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0}>
                                <Button variant="outline" size="sm" disabled>Cancel Order</Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Delivered orders cannot be cancelled</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default Orders;
