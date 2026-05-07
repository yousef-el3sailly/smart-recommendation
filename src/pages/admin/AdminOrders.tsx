import React, { useMemo, useState } from 'react';
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

  const updateStatus = async (orderId: string, status: string, currentStatus: string) => {
    if (status === currentStatus) return;
    if (currentStatus === 'delivered') {
      toast({ title: 'Cannot modify delivered orders', variant: 'destructive' });
      return;
    }
    if (currentStatus === 'cancelled') {
      toast({ title: 'Cannot modify cancelled orders', variant: 'destructive' });
      return;
    }
    if (status === 'cancelled') {
      // Open confirmation dialog
      setPendingCancel({ id: orderId, current: currentStatus });
      return;
    }
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Order status updated to ${status}` });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-revenue'] });
      qc.invalidateQueries({ queryKey: ['admin-revenue-over-time'] });
    }
  };

  const confirmCancel = async () => {
    if (!pendingCancel) return;
    const { error } = await supabase.rpc('cancel_order', { p_order_id: pendingCancel.id });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Order cancelled', description: 'Stock has been restored.' });
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
        <h2 className="text-2xl font-bold">Orders</h2>
        <p className="text-sm text-muted-foreground">{filteredOrders.length} of {orders?.length ?? 0}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 mb-4">
        <div className="relative sm:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID or user…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger><SelectValue placeholder="Date range" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
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
                  {orders && orders.length > 0 ? 'No orders match your filters' : 'No orders yet'}
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order: any) => (
                <TableRow key={order.id} className="hover:bg-muted/40">
                  <TableCell className="font-mono text-xs">#{order.id.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell>
                    <p className="font-mono text-xs">{order.user_id.slice(0, 8)}</p>
                  </TableCell>
                  <TableCell>{order.order_items?.length ?? 0} items</TableCell>
                  <TableCell className="font-medium">{Number(order.total_price).toLocaleString()} EGP</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(v) => updateStatus(order.id, v, order.status)}
                      disabled={order.status === 'delivered' || order.status === 'cancelled'}
                    >
                      <SelectTrigger className="w-36">
                        <Badge className={statusColor[order.status] || ''}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
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
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the order and restore stock for all items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>Yes, Cancel Order</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminOrders;
