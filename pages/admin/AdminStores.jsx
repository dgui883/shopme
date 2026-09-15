import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/shopme/PageHeader';
import StatusBadge from '@/components/shopme/StatusBadge';
import EmptyState from '@/components/shopme/EmptyState';
import { storeService } from '@/services/storeService';
import { Store as StoreIcon } from 'lucide-react';

export default function AdminStores() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    storeService.list().then((r) => { if (mounted) { setRows(r); setLoading(false); } });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Stores" description="All connected Shopify stores across SHOPME." />

      <Card>
        <CardContent className="px-0">
          {loading ? (
            <div className="space-y-2 px-6 py-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : rows.length === 0 ? (
            <EmptyState className="mx-6 my-6" icon={StoreIcon} title="No stores connected" />
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Store</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Connected</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead className="pr-6">Orders</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="pl-6 font-mono text-xs font-medium">{s.url}</TableCell>
                        <TableCell className="font-medium">{s.owner}</TableCell>
                        <TableCell><StatusBadge status={s.status} /></TableCell>
                        <TableCell className="text-muted-foreground">{s.connected}</TableCell>
                        <TableCell className="text-muted-foreground">{s.lastSync}</TableCell>
                        <TableCell className="pr-6 font-medium">{s.orders.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-2 px-4 md:hidden">
                {rows.map((s) => (
                  <div key={s.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold">{s.url}</span>
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="mt-1.5 text-sm font-medium">{s.owner}</p>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Connected {s.connected}</span>
                      <span>{s.orders.toLocaleString()} orders</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}