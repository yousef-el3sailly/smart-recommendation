import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Package, Users, ShoppingCart, TrendingUp, Percent, Receipt, XCircle, ArrowUpRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, CartesianGrid, Tooltip, LabelList } from 'recharts';
import { Badge } from '@/components/ui/badge';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];

const AdminDashboard = () => {
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

  // ===== KPIs =====
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

      // Conversion rate = orders / unique sessions (approx by clicks count)
      const totalClicks = clicks?.length ?? 0;
      const conversionRate = totalClicks > 0 ? (nonCancelled.length / totalClicks) * 100 : 0;

      // AOV based on non-cancelled orders
      const aovBase = nonCancelled.reduce((s, o) => s + Number(o.total_price), 0);
      const aov = nonCancelled.length > 0 ? aovBase / nonCancelled.length : 0;

      // Cancellation rate
      const cancellationRate = allOrders.length > 0 ? (cancelled.length / allOrders.length) * 100 : 0;

      // Revenue growth: this month vs previous month (delivered)
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      const thisMonthRev = delivered
        .filter(o => new Date(o.created_at).getTime() >= thisMonthStart)
        .reduce((s, o) => s + Number(o.total_price), 0);
      const lastMonthRev = delivered
        .filter(o => {
          const t = new Date(o.created_at).getTime();
          return t >= lastMonthStart && t < thisMonthStart;
        })
        .reduce((s, o) => s + Number(o.total_price), 0);
      const revenueGrowth = lastMonthRev > 0
        ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100
        : (thisMonthRev > 0 ? 100 : 0);

      // Stock turnover rate ~= units sold / current stock on hand
      const unitsSold = (items ?? []).reduce((s: number, it: any) => {
        return it.orders?.status !== 'cancelled' ? s + (it.quantity ?? 0) : s;
      }, 0);
      const stockOnHand = (products ?? []).reduce((s, p) => s + (p.stock ?? 0), 0);
      const stockTurnover = stockOnHand > 0 ? unitsSold / stockOnHand : 0;

      return {
        conversionRate,
        aov,
        cancellationRate,
        revenueGrowth,
        stockTurnover,
        totalClicks,
        nonCancelledOrders: nonCancelled.length,
      };
    },
  });

  // ===== Conversion Funnel =====
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
        { name: 'Views', value: viewsRes.count ?? 0, fill: 'hsl(var(--primary))' },
        { name: 'Clicks', value: clicksRes.count ?? 0, fill: '#8b5cf6' },
        { name: 'Add to Cart', value: cartRes.count ?? 0, fill: '#f59e0b' },
        { name: 'Orders', value: orderCount, fill: '#10b981' },
      ];
    },
  });

  // ===== Low stock alerts =====
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

  // ===== Orders per day (last 14 days) =====
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
        const d = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        counts[d] = (counts[d] ?? 0) + 1;
      });
      return Object.entries(counts).map(([date, orders]) => ({ date, orders }));
    },
  });

  // Revenue over time (line chart) - excludes cancelled orders
  const { data: revenueOverTime } = useQuery({
    queryKey: ['admin-revenue-over-time'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('total_price, created_at, status');
      if (!data || data.length === 0) return [];
      const byDate: Record<string, number> = {};
      data.filter(o => o.status === 'delivered').forEach(o => {
        const d = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        byDate[d] = (byDate[d] || 0) + Number(o.total_price);
      });
      return Object.entries(byDate).map(([date, revenue]) => ({ date, revenue }));
    },
  });

  // Products by category (pie chart)
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

  // Users by faculty (bar chart)
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

  // Recommendation analytics: clicks, conversions, conversion rate per product
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

  // Top recommended products per faculty (based on click counts grouped by faculty)
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

  const revenueChartConfig = { revenue: { label: 'Revenue (EGP)', color: 'hsl(var(--primary))' } };
  const ordersChartConfig = { orders: { label: 'Orders', color: 'hsl(var(--primary))' } };
  const facultyChartConfig = { count: { label: 'Users', color: 'hsl(var(--primary))' } };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{productCount ?? '...'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{userCount ?? '...'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{orderCount ?? '...'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueData ? `${revenueData.total.toLocaleString()} EGP` : '...'}</div>
            <p className="text-xs text-muted-foreground mt-1">From delivered orders only{revenueData?.pendingCount ? ` · ${revenueData.pendingCount} pending` : ''}</p>
          </CardContent>
        </Card>
      </div>

      {/* Business KPIs */}
      <h3 className="text-lg font-semibold mb-3">Business Metrics</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis ? `${kpis.conversionRate.toFixed(1)}%` : '...'}</div>
            <p className="text-xs text-muted-foreground mt-1">Orders ÷ product clicks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis ? `${Math.round(kpis.aov).toLocaleString()} EGP` : '...'}</div>
            <p className="text-xs text-muted-foreground mt-1">Across non-cancelled orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis ? `${kpis.cancellationRate.toFixed(1)}%` : '...'}</div>
            <p className="text-xs text-muted-foreground mt-1">Cancelled ÷ all orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue Growth</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpis && kpis.revenueGrowth < 0 ? 'text-destructive' : ''}`}>
              {kpis ? `${kpis.revenueGrowth >= 0 ? '+' : ''}${kpis.revenueGrowth.toFixed(1)}%` : '...'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month vs last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock Turnover</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis ? `${kpis.stockTurnover.toFixed(2)}×` : '...'}</div>
            <p className="text-xs text-muted-foreground mt-1">Units sold ÷ stock on hand</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel + Low stock */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader><CardTitle className="text-base">Conversion Funnel</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            {funnel && funnel.some(f => f.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} layout="vertical" margin={{ left: 20, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" fontSize={12} width={90} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {funnel.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="value" position="right" fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm flex items-center justify-center h-full">No funnel data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Low Stock Alerts (≤ 5 units)
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
                      {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">All products are well stocked.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders per day */}
      <Card className="mb-8">
        <CardHeader><CardTitle className="text-base">Orders Per Day (last 14 days)</CardTitle></CardHeader>
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
            <p className="text-muted-foreground text-sm flex items-center justify-center h-full">No recent orders</p>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Revenue Line Chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue Over Time</CardTitle></CardHeader>
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
              <p className="text-muted-foreground text-sm flex items-center justify-center h-full">No order data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Products by Category</CardTitle></CardHeader>
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
              <p className="text-muted-foreground text-sm flex items-center justify-center h-full">No products yet</p>
            )}
          </CardContent>
        </Card>

        {/* Faculty Bar Chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Users by Faculty</CardTitle></CardHeader>
          <CardContent className="h-[250px]">
            {facultyData && facultyData.length > 0 ? (
              <ChartContainer config={facultyChartConfig} className="h-full w-full">
                <BarChart data={facultyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="faculty" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-sm flex items-center justify-center h-full">No users yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lists Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Most Popular Products</CardTitle></CardHeader>
          <CardContent>
            {popularProducts && popularProducts.length > 0 ? (
              <div className="space-y-3">
                {popularProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}.</span>
                      <span className="font-medium text-sm">{p.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Score: {p.popularity_score ?? 0}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No products yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Order #{o.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{Number(o.total_price).toLocaleString()} EGP</p>
                      <p className="text-xs capitalize text-muted-foreground">{o.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No orders yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendation Analytics */}
      <h2 className="text-2xl font-bold mt-10 mb-6">Recommendation Analytics</h2>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Clicked Products</CardTitle>
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
                      {p.clicks} clicks · {p.rate.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No clicks tracked yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Best Conversion Rate</CardTitle>
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
              <p className="text-muted-foreground text-sm">Not enough data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Top Recommended Products per Faculty</CardTitle>
        </CardHeader>
        <CardContent>
          {topPerFaculty && topPerFaculty.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {topPerFaculty.map((f) => (
                <div key={f.faculty} className="space-y-2">
                  <h3 className="font-semibold text-sm text-primary">{f.faculty}</h3>
                  {f.top.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No data yet.</p>
                  ) : (
                    f.top.map((p, i) => (
                      <div key={p.id} className="flex justify-between text-sm">
                        <span className="truncate">{i + 1}. {p.name}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{p.clicks}</span>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No faculty interaction data yet. Once users browse products, top picks per faculty will appear here.
            </p>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminDashboard;
