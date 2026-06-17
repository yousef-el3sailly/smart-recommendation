import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, Loader2, Inbox } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const AdminOrders = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [pendingCancel, setPendingCancel] = useState<{ id: string; current: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const now = Date.now();
    const dateMs: Record<string, number> = {
      '7d': 7 * 86400000,
      '30d': 30 * 86400000,
      '90d': 90 * 86400000,
    };
    const cutoff = dateFilter === 'all' ? null : now - (dateMs[dateFilter] ?? 0);
    const q = search.trim().toLowerCase();
    return orders.filter((o: any) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (cutoff && new Date(o.created_at).getTime() < cutoff) return false;
      if (q) {
        const idMatch = o.id.toLowerCase().includes(q);
        const userMatch = o.user_id.toLowerCase().includes(q);
        if (!idMatch && !userMatch) return false;
      }
      return true;
    });
  }, [orders, statusFilter, dateFilter, search]);

  const statusLabel = (status: string) =>
    t(`admin.orderStatus.${status}`, { defaultValue: status });

  const updateStatus = async (orderId: string, status: string, currentStatus: string) => {
    if (status === currentStatus) return;
    if (currentStatus === 'delivered') {
      toast({ title: t('admin.ordersPage.cannotModifyDelivered'), variant: 'destructive' });
      return;
    }
    if (currentStatus === 'cancelled') {
      toast({ title: t('admin.ordersPage.cannotModifyCancelled'), variant: 'destructive' });
      return;
    }
    if (status === 'cancelled') {
      setPendingCancel({ id: orderId, current: currentStatus });
      return;
    }
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) {
      toast({ title: t('admin.common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('admin.ordersPage.statusUpdated', { status: statusLabel(status) }) });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-revenue'] });
      qc.invalidateQueries({ queryKey: ['admin-revenue-over-time'] });
    }
  };

  const confirmCancel = async () => {
    if (!pendingCancel) return;
    const { error } = await supabase.rpc('cancel_order', { p_order_id: pendingCancel.id });
    if (error) {
      toast({ title: t('admin.common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('admin.ordersPage.cancelled'), description: t('admin.ordersPage.cancelledDesc') });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['admin-revenue'] });
      qc.invalidateQueries({ queryKey: ['admin-revenue-over-time'] });
    }
    setPendingCancel(null);
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold">{t('admin.ordersPage.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('admin.ordersPage.summary', { shown: filteredOrders.length, total: orders?.length ?? 0 })}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 mb-4">
        <div className="relative sm:col-span-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('admin.ordersPage.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue placeholder={t('admin.ordersPage.status')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.ordersPage.allStatuses')}</SelectItem>
            <SelectItem value="pending">{t('admin.orderStatus.pending')}</SelectItem>
            <SelectItem value="delivered">{t('admin.orderStatus.delivered')}</SelectItem>
            <SelectItem value="cancelled">{t('admin.orderStatus.cancelled')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger><SelectValue placeholder={t('admin.ordersPage.dateRange')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.ordersPage.allTime')}</SelectItem>
            <SelectItem value="7d">{t('admin.ordersPage.last7')}</SelectItem>
            <SelectItem value="30d">{t('admin.ordersPage.last30')}</SelectItem>
            <SelectItem value="90d">{t('admin.ordersPage.last90')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.ordersPage.orderId')}</TableHead>
              <TableHead>{t('admin.ordersPage.customer')}</TableHead>
              <TableHead>{t('admin.ordersPage.items')}</TableHead>
              <TableHead>{t('admin.ordersPage.total')}</TableHead>
              <TableHead>{t('admin.ordersPage.status')}</TableHead>
              <TableHead>{t('admin.ordersPage.date')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  {orders && orders.length > 0 ? t('admin.ordersPage.noMatch') : t('admin.ordersPage.noOrders')}
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order: any) => (
                <TableRow key={order.id} className="hover:bg-muted/40">
                  <TableCell className="font-mono text-xs">#{order.id.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell>
                    <p className="font-mono text-xs">{order.user_id.slice(0, 8)}</p>
                  </TableCell>
                  <TableCell>{t('admin.ordersPage.itemsCount', { count: order.order_items?.length ?? 0 })}</TableCell>
                  <TableCell className="font-medium">{Number(order.total_price).toLocaleString()} EGP</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(v) => updateStatus(order.id, v, order.status)}
                      disabled={order.status === 'delivered' || order.status === 'cancelled'}
                    >
                      <SelectTrigger className="w-36">
                        <Badge className={statusColor[order.status] || ''}>
                          {statusLabel(order.status)}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{t('admin.orderStatus.pending')}</SelectItem>
                        <SelectItem value="delivered">{t('admin.orderStatus.delivered')}</SelectItem>
                        <SelectItem value="cancelled">{t('admin.orderStatus.cancelled')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!pendingCancel} onOpenChange={(open) => !open && setPendingCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.ordersPage.cancelTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.ordersPage.cancelDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.ordersPage.keepOrder')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>{t('admin.ordersPage.confirmCancel')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminOrders;
