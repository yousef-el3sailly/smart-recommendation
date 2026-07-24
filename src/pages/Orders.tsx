import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SeoHead } from '@/components/SeoHead';

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
  const { t, i18n } = useTranslation();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;

  const handleCancel = async (orderId: string) => {
    setCancellingId(orderId);
    const { error } = await supabase.rpc('cancel_order', { p_order_id: orderId });
    setCancellingId(null);
    if (error) {
      toast({ title: t('orders.cancelFailed'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('orders.cancelled'), description: t('orders.cancelledDesc') });
      qc.invalidateQueries({ queryKey: ['user-orders'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    }
  };

  const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';

  return (
    <UserLayout>
      <SeoHead title={t('orders.title')} />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">{t('orders.title')}</h1>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Package className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">{t('orders.none')}</h2>
            <p className="text-muted-foreground">{t('orders.noneDesc')}</p>
            <Button asChild><Link to="/products">{t('home.browseProducts')}</Link></Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const canCancel = order.status === 'pending';
              const isDelivered = order.status === 'delivered';
              const statusKey = `orders.status.${order.status}` as const;
              return (
                <Card key={order.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-base">
                        {t('orders.orderNum', { id: order.id.slice(0, 8).toUpperCase() })}
                      </CardTitle>
                      <Badge className={statusColor[order.status] || ''}>
                        {t(statusKey as any)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString(locale, { dateStyle: 'medium' })}
                      {' · '}{order.payment_method === 'cash_on_delivery' ? t('checkout.cashOnDelivery') : t('checkout.cardPayment')}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.products?.name ?? '-'} × {item.quantity}</span>
                          <span>{(item.price * item.quantity).toLocaleString()} EGP</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t mt-3 pt-3 flex justify-between font-bold">
                      <span>{t('orders.total')}</span>
                      <span>{Number(order.total_price).toLocaleString()} EGP</span>
                    </div>
                    <div className="mt-3 flex justify-end">
                      {canCancel ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={cancellingId === order.id}>
                              {cancellingId === order.id ? (
                                <><Loader2 className="me-2 h-3.5 w-3.5 animate-spin" /> {t('orders.cancelling')}</>
                              ) : t('orders.cancel')}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('orders.cancelTitle')}</AlertDialogTitle>
                              <AlertDialogDescription>{t('orders.cancelDesc')}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('orders.keep')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleCancel(order.id)}>
                                {t('orders.confirmCancel')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : isDelivered ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0}>
                                <Button variant="outline" size="sm" disabled>{t('orders.cancel')}</Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{t('orders.deliveredCantCancel')}</TooltipContent>
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
