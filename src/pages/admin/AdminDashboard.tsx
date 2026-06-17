import React from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Package, Users, ShoppingCart, TrendingUp, Percent, Receipt, XCircle, ArrowUpRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, CartesianGrid, Tooltip, LabelList } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { DatabaseExport } from '@/components/admin/DatabaseExport';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const translateFaculty = (f: string) => t(`faculties.${f}`, { defaultValue: f });

  const { data: productCount } = useQuery({
    queryKey: ['admin-product-count'],
    queryFn: async () => {
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const { data: userCount } = useQuery({
    queryKey: ['admin-user-count'],
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const { data: orderCount } = useQuery({
    queryKey: ['admin-order-count'],
    queryFn: async () => {
      const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const { data: revenueData } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('total_price, status');
      const delivered = data?.filter(o => o.status === 'delivered') ?? [];
      const total = delivered.reduce((sum, o) => sum + Number(o.total_price), 0);
      const pendingCount = data?.filter(o => o.status === 'pending').length ?? 0;
      return { total, delivered: total, pendingCount };
    },
  });

  const { data: kpis } = useQuery({
    queryKey: ['admin-kpis'],
    queryFn: async () => {
      const [{ data: orders }, { data: clicks }, { data: items }, { data: products }] = await Promise.all([
        supabase.from('orders').select('id, total_price, status, created_at, user_id'),
        supabase.from('product_clicks').select('id, created_at'),
        supabase.from('order_items').select('quantity, orders!inner(status)'),
        supabase.from('products').select('stock'),
      ]);

      const allOrders = orders ?? [];
      const nonCancelled = allOrders.filter(o => o.status !== 'cancelled');
      const cancelled = allOrders.filter(o => o.status === 'cancelled');
      const delivered = allOrders.filter(o => o.status === 'delivered');

      const totalClicks = clicks?.length ?? 0;
      const conversionRate = totalClicks > 0 ? (nonCancelled.length / totalClicks) * 100 : 0;

      const aovBase = nonCancelled.reduce((s, o) => s + Number(o.total_price), 0);
      const aov = nonCancelled.length > 0 ? aovBase / nonCancelled.length : 0;

      const cancellationRate = allOrders.length > 0 ? (cancelled.length / allOrders.length) * 100 : 0;

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      const thisMonthRev = delivered
        .filter(o => new Date(o.created_at).getTime() >= thisMonthStart)
        .reduce((s, o) => s + Number(o.total_price), 0);
      const lastMonthRev = delivered
        .filter(o => {
          const tm = new Date(o.created_at).getTime();
          return tm >= lastMonthStart && tm < thisMonthStart;
        })
        .reduce((s, o) => s + Number(o.total_price), 0);
      const revenueGrowth = lastMonthRev > 0
        ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100
        : (thisMonthRev > 0 ? 100 : 0);

      const unitsSold = (items ?? []).reduce((s: number, it: any) => {
        return it.orders?.status !== 'cancelled' ? s + (it.quantity ?? 0) : s;
      }, 0);
      const stockOnHand = (products ?? []).reduce((s, p) => s + (p.stock ?? 0), 0);
      const stockTurnover = stockOnHand > 0 ? unitsSold / stockOnHand : 0;

      return {
        conversionRate, aov, cancellationRate, revenueGrowth, stockTurnover,
        totalClicks, nonCancelledOrders: nonCancelled.length,
      };
    },
  });

  const { data: funnel } = useQuery({
    queryKey: ['admin-funnel'],
    queryFn: async () => {
      const [viewsRes, clicksRes, cartRes, ordersRes] = await Promise.all([
        supabase.from('recently_viewed').select('id', { count: 'exact', head: true }),
        supabase.from('product_clicks').select('id', { count: 'exact', head: true }),
        supabase.from('cart_events').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, status'),
      ]);
      const orderCount = (ordersRes.data ?? []).filter(o => o.status !== 'cancelled').length;
      return [
        { key: 'views', value: viewsRes.count ?? 0, fill: 'hsl(var(--primary))' },
        { key: 'clicks', value: clicksRes.count ?? 0, fill: '#8b5cf6' },
        { key: 'addToCart', value: cartRes.count ?? 0, fill: '#f59e0b' },
        { key: 'orders', value: orderCount, fill: '#10b981' },
      ];
    },
  });

  const { data: lowStock } = useQuery({
    queryKey: ['admin-low-stock'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, stock, category')
        .lte('stock', 5)
        .order('stock', { ascending: true })
        .limit(10);
      return data ?? [];
    },
  });

  const { data: ordersPerDay } = useQuery({
    queryKey: ['admin-orders-per-day'],
    queryFn: async () => {
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const { data } = await supabase
        .from('orders')
        .select('created_at, status')
        .gte('created_at', since.toISOString());
      const counts: Record<string, number> = {};
      (data ?? []).forEach(o => {
        if (o.status === 'cancelled') return;
        const d = new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        counts[d] = (counts[d] ?? 0) + 1;
      });
      return Object.entries(counts).map(([date, orders]) => ({ date, orders }));
    },
  });

  const { data: revenueOverTime } = useQuery({
    queryKey: ['admin-revenue-over-time'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('total_price, created_at, status');
      if (!data || data.length === 0) return [];
      const byDate: Record<string, number> = {};
      data.filter(o => o.status === 'delivered').forEach(o => {
        const d = new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        byDate[d] = (byDate[d] || 0) + Number(o.total_price);
      });
      return Object.entries(byDate).map(([date, revenue]) => ({ date, revenue }));
    },
  });

  const { data: categoryData } = useQuery({
    queryKey: ['admin-category-distribution'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('category');
      if (!data) return [];
      const counts: Record<string, number> = {};
      data.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  const { data: facultyData } = useQuery({
    queryKey: ['admin-faculty-distribution'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('faculty');
      if (!data) return [];
      const counts: Record<string, number> = {};
      data.forEach(p => { counts[p.faculty ?? 'Other'] = (counts[p.faculty ?? 'Other'] || 0) + 1; });
      return Object.entries(counts).map(([faculty, count]) => ({ faculty, count }));
    },
  });

  const { data: popularProducts } = useQuery({
    queryKey: ['admin-popular'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, popularity_score, rating')
        .order('popularity_score', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_price, status, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: recAnalytics } = useQuery({
    queryKey: ['admin-recommendation-analytics'],
    queryFn: async () => {
      const [{ data: clicks }, { data: items }, { data: products }] = await Promise.all([
        supabase.from('product_clicks').select('product_id'),
        supabase.from('order_items').select('product_id, quantity, orders!inner(status)'),
        supabase.from('products').select('id, name, category'),
      ]);

      const clickMap: Record<string, number> = {};
      (clicks ?? []).forEach((c) => {
        clickMap[c.product_id] = (clickMap[c.product_id] ?? 0) + 1;
      });
      const orderMap: Record<string, number> = {};
      (items ?? []).forEach((it: any) => {
        if (it.orders?.status !== 'cancelled') {
          orderMap[it.product_id] = (orderMap[it.product_id] ?? 0) + (it.quantity ?? 1);
        }
      });

      const rows = (products ?? []).map((p) => {
        const c = clickMap[p.id] ?? 0;
        const o = orderMap[p.id] ?? 0;
        const rate = c > 0 ? (o / c) * 100 : 0;
        return { id: p.id, name: p.name, category: p.category, clicks: c, orders: o, rate };
      });

      const mostClicked = [...rows].sort((a, b) => b.clicks - a.clicks).slice(0, 5);
      const mostConverted = [...rows].filter((r) => r.clicks > 0).sort((a, b) => b.rate - a.rate).slice(0, 5);
      return { mostClicked, mostConverted };
    },
  });

  const { data: topPerFaculty } = useQuery({
    queryKey: ['admin-top-per-faculty'],
    queryFn: async () => {
      const { data: clicks } = await supabase
        .from('product_clicks')
        .select('product_id, faculty');
      const { data: products } = await supabase.from('products').select('id, name');
      const productMap = new Map((products ?? []).map((p) => [p.id, p.name]));

      const perFac: Record<string, Record<string, number>> = {};
      (clicks ?? []).forEach((c) => {
        if (!c.faculty) return;
        perFac[c.faculty] = perFac[c.faculty] ?? {};
        perFac[c.faculty][c.product_id] = (perFac[c.faculty][c.product_id] ?? 0) + 1;
      });

      return Object.entries(perFac).map(([faculty, counts]) => {
        const top = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([pid, n]) => ({ id: pid, name: productMap.get(pid) ?? 'Unknown', clicks: n }));
        return { faculty, top };
      });
    },
  });

  const revenueChartConfig = { revenue: { label: t('admin.dashboardPage.axis.revenue'), color: 'hsl(var(--primary))' } };
  const ordersChartConfig = { orders: { label: t('admin.dashboardPage.axis.orders'), color: 'hsl(var(--primary))' } };
  const facultyChartConfig = { count: { label: t('admin.dashboardPage.axis.users'), color: 'hsl(var(--primary))' } };

  const funnelDisplay = (funnel ?? []).map(f => ({
    ...f,
    name: t(`admin.dashboardPage.funnel.${f.key}`),
  }));

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-6">{t('admin.dashboardPage.overview')}</h2>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8 items-stretch">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.dashboardPage.totalProducts')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold tabular-nums">{productCount ?? '...'}</div></CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.dashboardPage.totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold tabular-nums">{userCount ?? '...'}</div></CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.dashboardPage.totalOrders')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold tabular-nums">{orderCount ?? '...'}</div></CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.dashboardPage.totalRevenue')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{revenueData ? `${revenueData.total.toLocaleString()} EGP` : '...'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('admin.dashboardPage.revenueNote')}
              {revenueData?.pendingCount ? ` · ${t('admin.dashboardPage.pendingSuffix', { count: revenueData.pendingCount })}` : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Business KPIs */}
      <h3 className="text-lg font-semibold mb-3">{t('admin.dashboardPage.businessMetrics')}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8 items-stretch">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.dashboardPage.conversionRate')}</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{kpis ? `${kpis.conversionRate.toFixed(1)}%` : '...'}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('admin.dashboardPage.conversionDesc')}</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.dashboardPage.aov')}</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{kpis ? `${Math.round(kpis.aov).toLocaleString()} EGP` : '...'}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('admin.dashboardPage.aovDesc')}</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.dashboardPage.cancellationRate')}</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{kpis ? `${kpis.cancellationRate.toFixed(1)}%` : '...'}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('admin.dashboardPage.cancellationDesc')}</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.dashboardPage.revenueGrowth')}</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tabular-nums ${kpis && kpis.revenueGrowth < 0 ? 'text-destructive' : ''}`}>
              {kpis ? `${kpis.revenueGrowth >= 0 ? '+' : ''}${kpis.revenueGrowth.toFixed(1)}%` : '...'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('admin.dashboardPage.revenueGrowthDesc')}</p>
          </CardContent>
        </Card>
        <Card className="h-full sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.dashboardPage.stockTurnover')}</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{kpis ? `${kpis.stockTurnover.toFixed(2)}×` : '...'}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('admin.dashboardPage.stockTurnoverDesc')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel + Low stock */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader><CardTitle className="text-base">{t('admin.dashboardPage.conversionFunnel')}</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            {funnelDisplay.length > 0 && funnelDisplay.some(f => f.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelDisplay} layout="vertical" margin={{ left: 20, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" fontSize={12} width={90} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {funnelDisplay.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="value" position="right" fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm flex items-center justify-center h-full">{t('admin.dashboardPage.noFunnelData')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {t('admin.dashboardPage.lowStockTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock && lowStock.length > 0 ? (
              <div className="space-y-3 max-h-[240px] overflow-y-auto">
                {lowStock.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category}</p>
                    </div>
                    <Badge variant={p.stock === 0 ? 'destructive' : 'secondary'} className="whitespace-nowrap">
                      {p.stock === 0 ? t('admin.dashboardPage.outOfStock') : t('admin.dashboardPage.leftCount', { count: p.stock })}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t('admin.dashboardPage.allStocked')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders per day */}
      <Card className="mb-8">
        <CardHeader><CardTitle className="text-base">{t('admin.dashboardPage.ordersPerDay')}</CardTitle></CardHeader>
        <CardContent className="h-[260px]">
          {ordersPerDay && ordersPerDay.length > 0 ? (
            <ChartContainer config={ordersChartConfig} className="h-full w-full">
              <BarChart data={ordersPerDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground text-sm flex items-center justify-center h-full">{t('admin.dashboardPage.noRecentOrders')}</p>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader><CardTitle className="text-base">{t('admin.dashboardPage.revenueOverTime')}</CardTitle></CardHeader>
          <CardContent className="h-[250px]">
            {revenueOverTime && revenueOverTime.length > 0 ? (
              <ChartContainer config={revenueChartConfig} className="h-full w-full">
                <LineChart data={revenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-sm flex items-center justify-center h-full">{t('admin.dashboardPage.noOrderData')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t('admin.dashboardPage.productsByCategory')}</CardTitle></CardHeader>
          <CardContent className="h-[250px]">
            {categoryData && categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm flex items-center justify-center h-full">{t('admin.dashboardPage.noProductsYet')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t('admin.dashboardPage.usersByFaculty')}</CardTitle></CardHeader>
          <CardContent className="h-[250px]">
            {facultyData && facultyData.length > 0 ? (
              <ChartContainer config={facultyChartConfig} className="h-full w-full">
                <BarChart data={facultyData.map(f => ({ ...f, faculty: translateFaculty(f.faculty) }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="faculty" fontSize={11} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis fontSize={12} allowDecimals={false} orientation={isRtl ? 'right' : 'left'} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-sm flex items-center justify-center h-full">{t('admin.dashboardPage.noUsersYet')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lists Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t('admin.dashboardPage.mostPopular')}</CardTitle></CardHeader>
          <CardContent>
            {popularProducts && popularProducts.length > 0 ? (
              <div className="space-y-3">
                {popularProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}.</span>
                      <span className="font-medium text-sm">{p.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{t('admin.dashboardPage.score')}: {p.popularity_score ?? 0}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t('admin.dashboardPage.noProductsYet')}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('admin.dashboardPage.recentOrders')}</CardTitle></CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{t('admin.dashboardPage.orderShort', { id: o.id.slice(0, 8).toUpperCase() })}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-end">
                      <p className="font-medium text-sm">{Number(o.total_price).toLocaleString()} EGP</p>
                      <p className="text-xs text-muted-foreground">{t(`admin.orderStatus.${o.status}`, { defaultValue: o.status })}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t('admin.dashboardPage.noOrdersYet')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendation Analytics */}
      <h2 className="text-2xl font-bold mt-10 mb-6">{t('admin.dashboardPage.recAnalytics')}</h2>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.dashboardPage.mostClicked')}</CardTitle>
          </CardHeader>
          <CardContent>
            {recAnalytics?.mostClicked && recAnalytics.mostClicked.length > 0 ? (
              <div className="space-y-3">
                {recAnalytics.mostClicked.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}.</span>
                      <span className="font-medium text-sm truncate">{p.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {t('admin.dashboardPage.clicksSuffix', { clicks: p.clicks, rate: p.rate.toFixed(1) })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t('admin.dashboardPage.noClicksTracked')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.dashboardPage.bestConversion')}</CardTitle>
          </CardHeader>
          <CardContent>
            {recAnalytics?.mostConverted && recAnalytics.mostConverted.length > 0 ? (
              <div className="space-y-3">
                {recAnalytics.mostConverted.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}.</span>
                      <span className="font-medium text-sm truncate">{p.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-primary whitespace-nowrap">
                      {p.rate.toFixed(1)}% ({p.orders}/{p.clicks})
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t('admin.dashboardPage.notEnoughData')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">{t('admin.dashboardPage.topPerFaculty')}</CardTitle>
        </CardHeader>
        <CardContent>
          {topPerFaculty && topPerFaculty.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {topPerFaculty.map((f) => (
                <div key={f.faculty} className="space-y-2">
                  <h3 className="font-semibold text-sm text-primary">{translateFaculty(f.faculty)}</h3>
                  {f.top.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t('admin.dashboardPage.noFacultyData')}</p>
                  ) : (
                    f.top.map((p, i) => (
                      <div key={p.id} className="flex justify-between text-sm">
                        <span className="truncate">{i + 1}. {p.name}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ms-2">{p.clicks}</span>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {t('admin.dashboardPage.noFacultyInteractions')}
            </p>
          )}
        </CardContent>
      </Card>

      <DatabaseExport />
    </AdminLayout>
  );
};

export default AdminDashboard;
