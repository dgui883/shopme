import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import PageHeader from '@/components/shopme/PageHeader';
import { shopifyService } from '@/services/shopifyService';
import { Package, ShoppingCart, Users, Boxes, ExternalLink, Settings as SettingsIcon, RefreshCw } from 'lucide-react';

export default function Store() {
  const [conn, setConn] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const [connData, statsData] = await Promise.all([
        shopifyService.getConnection(),
        shopifyService.getStoreStats(),
      ]);
      if (!active) return;
      setConn(connData);
      setStats(statsData);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const sync = async () => {
    setSyncing(true);
    try {
      await shopifyService.syncOrders();
      const statsData = await shopifyService.getStoreStats();
      setStats(statsData);
    } finally {
      setSyncing(false);
    }
  };

  const STAT_CARDS = [
    { label: 'Products', value: stats?.products, icon: Package },
    { label: 'Orders', value: stats?.orders, icon: ShoppingCart },
    { label: 'Customers', value: stats?.customers, icon: Users },
    { label: 'Inventory', value: `${stats?.inventory ?? 0}%`, icon: Boxes },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Your Shopify Store" description="Manage your Shopify connection and store overview." />

      {/* Connection card */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          {loading ? (
            <Skeleton className="h-24" />
          ) : (
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M5 7h14l-1 9.5a2 2 0 0 1-2 1.8H8a2 2 0 0 1-2-1.8L5 7Zm4 2V7.2a3 3 0 0 1 6 0V9"/></svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-700">Connected</span>
                  </div>
                  <p className="mt-1 text-lg font-semibold text-foreground">{conn?.storeName}</p>
                  <p className="text-sm text-muted-foreground">{conn?.storeUrl}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Connected {conn?.connectedDate} · {conn?.plan}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={sync} disabled={syncing}>
                  <RefreshCw className={syncing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> {syncing ? 'Syncing…' : 'Sync now'}
                </Button>
                <Button variant="outline"><ExternalLink className="h-4 w-4" /> Open in Shopify</Button>
                <Button><SettingsIcon className="h-4 w-4" /> Manage Connection</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Store statistics */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Store statistics</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          ) : (
            STAT_CARDS.map((s) => (
              <Card key={s.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <s.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight">{s.value}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Connection status */}
      <Card>
        <CardHeader><CardTitle>Connection status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Connection state', value: 'Active', tone: 'success' },
            { label: 'Store URL', value: conn?.storeUrl },
            { label: 'Access token', value: conn?.accessToken, mono: true },
            { label: 'Webhooks', value: '3 active' },
            { label: 'Last sync', value: '2 minutes ago' },
          ].map((row, i, arr) => (
            <div key={row.label}>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className={row.mono ? 'font-mono text-sm text-muted-foreground' : 'text-sm font-medium text-foreground'}>
                  {row.tone === 'success' && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" />}
                  {row.value}
                </span>
              </div>
              {i < arr.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}