import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import StatCard from '@/components/shopme/StatCard';
import StatusBadge from '@/components/shopme/StatusBadge';
import { userService } from '@/services/userService';
import { activityService } from '@/services/activityService';
import { Users, UserCheck, UserX, Ban, Store as StoreIcon, ArrowRight, Activity as ActivityIcon, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    userService.getStats().then((s) => { if (mounted) setStats(s); });
    activityService.listAdmin().then((a) => { if (mounted) { setActivity(a); setLoading(false); } });
    return () => { mounted = false; };
  }, []);

  const CARDS = [
    { label: 'Total Users', value: stats?.totalUsers?.value, icon: Users, accent: 'default' },
    { label: 'Active Users', value: stats?.activeUsers?.value, icon: UserCheck, accent: 'success' },
    { label: 'Suspended', value: stats?.suspended?.value, icon: UserX, accent: 'warning' },
    { label: 'Banned', value: stats?.banned?.value, icon: Ban, accent: 'danger' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">SHOPME Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage users, licenses, and connected Shopify stores.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {loading || !stats
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          : CARDS.map((c) => <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} accent={c.accent} />)}
      </div>

      {/* Connected stores highlight */}
      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <StoreIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Connected Shopify Stores</p>
              <p className="text-2xl font-bold tracking-tight">{stats?.connectedStores?.value ?? '—'}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/stores')}>View stores <ArrowRight className="h-3.5 w-3.5" /></Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: 'Manage users', desc: 'View and manage user accounts', to: '/admin/users', icon: Users },
              { label: 'Create licenses', desc: 'Generate activation codes', to: '/admin/licenses', icon: KeyRound },
              { label: 'View stores', desc: 'All connected Shopify stores', to: '/admin/stores', icon: StoreIcon },
              { label: 'Activity log', desc: 'System-wide event log', to: '/admin/activity', icon: ActivityIcon },
            ].map((q) => (
              <button key={q.label} onClick={() => navigate(q.to)} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:shadow-soft-md">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <q.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{q.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{q.desc}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent activity</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/activity')}>All</Button>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3.5">
              {activity.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className={cn(
                    'mt-1 h-2 w-2 shrink-0 rounded-full',
                    a.status === 'success' ? 'bg-emerald-500' : a.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                  )} />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{a.action}</p>
                    <p className="text-xs text-muted-foreground">{a.user} · {a.time}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}