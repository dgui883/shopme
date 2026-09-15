import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import StatCard from '@/components/shopme/StatCard';
import { HealthBadge, HealthDot } from '@/components/shopme/HealthBadge';
import StatusBadge from '@/components/shopme/StatusBadge';
import EmptyState from '@/components/shopme/EmptyState';
import { orderService } from '@/services/orderService';
import { activityService } from '@/services/activityService';
import {
  Package, AlertTriangle, ShieldAlert, DollarSign, ArrowRight, CheckCircle2, MessageSquare, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIORITY = {
  critical: { label: 'Critical', cls: 'bg-red-50 text-red-700 border-red-200' },
  needs_attention: { label: 'Needs Attention', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const ACTIVITY_ICON = { check: CheckCircle2, alert: AlertTriangle, message: MessageSquare, bell: Bell };

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [issues, setIssues] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [statsData, healthData, issuesData, ordersData, activityData] = await Promise.all([
        orderService.getDashboardStats(),
        orderService.getHealth(),
        orderService.getIssues(),
        orderService.list({ sort: 'newest' }),
        activityService.getRecent(6),
      ]);
      if (!mounted) return;
      setStats(statsData);
      setHealth(healthData);
      setIssues(issuesData);
      setOrders(ordersData.slice(0, 6));
      setActivity(activityData);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const STAT_CARDS = stats
    ? [
        { label: 'Total Orders', value: stats.totalOrders.value, delta: stats.totalOrders.delta, trend: stats.totalOrders.trend, sub: stats.totalOrders.sub, icon: Package, accent: 'default' },
        { label: 'Needs Attention', value: stats.needsAttention.value, delta: stats.needsAttention.delta, trend: stats.needsAttention.trend, sub: stats.needsAttention.sub, icon: AlertTriangle, accent: 'warning' },
        { label: 'Critical Issues', value: stats.criticalIssues.value, delta: stats.criticalIssues.delta, trend: stats.criticalIssues.trend, sub: stats.criticalIssues.sub, icon: ShieldAlert, accent: 'danger' },
        { label: 'Revenue', value: stats.revenue.value, delta: stats.revenue.delta, trend: stats.revenue.trend, sub: stats.revenue.sub, icon: DollarSign, accent: 'revenue' },
      ]
    : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's what's happening with your store today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Order Health</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: 'healthy', label: 'Healthy', value: health?.healthy ?? 0 },
              { key: 'needs_attention', label: 'Needs Attention', value: health?.needsAttention ?? 0 },
              { key: 'critical', label: 'Critical', value: health?.critical ?? 0 },
            ].map((row) => (
              <div key={row.key} className="flex items-center gap-3">
                <HealthDot health={row.key} />
                <span className="w-32 shrink-0 text-sm text-muted-foreground">{row.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full', row.key === 'healthy' ? 'bg-emerald-500' : row.key === 'needs_attention' ? 'bg-amber-500' : 'bg-red-500')}
                    style={{ width: `${row.value}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-medium text-foreground">{row.value}%</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Needs Your Attention</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/orders?filter=needs_attention')}>
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {issues.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="All caught up" description="No orders currently need attention." />
            ) : (
              <div className="space-y-3">
                {issues.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => navigate(`/orders/${issue.id}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">#{issue.orderNumber}</span>
                        <span className={cn('rounded-md border px-1.5 py-0.5 text-[11px] font-medium', PRIORITY[issue.priority]?.cls)}>
                          {PRIORITY[issue.priority]?.label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{issue.title} · {issue.customer}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-foreground">${issue.orderValue.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{issue.metaLabel}: {issue.meta}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            {orders.length === 0 ? (
              <EmptyState className="mx-6 my-6" icon={Package} title="No orders yet" description="Orders will appear here once your store syncs." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="pr-6">Health</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                      <TableCell className="pl-6 font-medium">#{o.number}</TableCell>
                      <TableCell className="text-muted-foreground">{o.customer}</TableCell>
                      <TableCell>${o.amount.toFixed(2)}</TableCell>
                      <TableCell className="pr-6"><HealthBadge health={o.health} size="sm" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <EmptyState icon={Bell} title="No recent activity" />
            ) : (
              <ul className="space-y-4">
                {activity.map((a) => {
                  const Icon = ACTIVITY_ICON[a.icon] || Bell;
                  const toneCls = a.tone === 'success' ? 'text-emerald-600 bg-emerald-50' : a.tone === 'warning' ? 'text-amber-600 bg-amber-50' : 'text-muted-foreground bg-muted';
                  return (
                    <li key={a.id} className="flex items-start gap-3">
                      <div className={cn('mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full', toneCls)}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">{a.text}</p>
                        <p className="text-xs text-muted-foreground">{a.time}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
