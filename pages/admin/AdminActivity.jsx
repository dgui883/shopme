import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/shopme/PageHeader';
import StatusBadge from '@/components/shopme/StatusBadge';
import EmptyState from '@/components/shopme/EmptyState';
import { activityService } from '@/services/activityService';
import { Search, Activity as ActivityIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminActivity() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    activityService.listAdmin().then((r) => { setRows(r); setLoading(false); });
  }, []);

  const filtered = rows.filter(
    (a) => a.action.toLowerCase().includes(search.toLowerCase()) || a.user.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Activity" description="System-wide log of user and admin events." />

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activity…" className="pl-9" />
      </div>

      <Card>
        <CardContent className="px-0">
          {loading ? (
            <div className="space-y-2 px-6 py-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState className="mx-6 my-6" icon={ActivityIcon} title="No matching activity" />
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>IP / Device</TableHead>
                      <TableHead className="pr-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="pl-6 text-muted-foreground">{a.time}</TableCell>
                        <TableCell className="font-medium">{a.user}</TableCell>
                        <TableCell className="text-foreground">{a.action}</TableCell>
                        <TableCell className="text-muted-foreground">{a.device}</TableCell>
                        <TableCell className="pr-6"><StatusBadge status={a.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-2 px-4 md:hidden">
                {filtered.map((a) => (
                  <div key={a.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{a.action}</span>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{a.user} · {a.time}</p>
                    <p className="text-xs text-muted-foreground">{a.device}</p>
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