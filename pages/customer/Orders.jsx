import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/shopme/PageHeader';
import { HealthBadge } from '@/components/shopme/HealthBadge';
import StatusBadge from '@/components/shopme/StatusBadge';
import EmptyState from '@/components/shopme/EmptyState';
import { orderService } from '@/services/orderService';
import { Search, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'needs_attention', label: 'Needs Attention' },
  { value: 'critical', label: 'Critical' },
  { value: 'unfulfilled', label: 'Unfulfilled' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'delayed', label: 'Delayed' },
];

const PAGE_SIZE = 8;

export default function Orders() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    orderService.list({ search, filter, sort }).then((r) => {
      if (!mounted) return;
      setRows(r);
      setLoading(false);
      setPage(1);
    });
    return () => { mounted = false; };
  }, [search, filter, sort]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Monitor and manage orders from your Shopify store." />

      {/* Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, customers, products…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'rounded-md border px-2.5 py-1.5 text-xs font-medium transition',
                  filter === f.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="amount-high">Amount: High → Low</SelectItem>
              <SelectItem value="amount-low">Amount: Low → High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="px-0">
          {loading ? (
            <div className="space-y-2 px-6 py-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : rows.length === 0 ? (
            <EmptyState className="mx-6 my-6" icon={Package} title="No orders match your filters" description="Try adjusting your search or filter to see more orders." />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((o) => (
                      <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                        <TableCell className="pl-6 font-mono font-medium">#{o.number}</TableCell>
                        <TableCell className="font-medium">{o.customer}</TableCell>
                        <TableCell className="max-w-[160px] truncate text-muted-foreground">{o.product}</TableCell>
                        <TableCell>${o.amount.toFixed(2)}</TableCell>
                        <TableCell><StatusBadge status={o.status} /></TableCell>
                        <TableCell><HealthBadge health={o.health} /></TableCell>
                        <TableCell className="text-muted-foreground">{o.created}</TableCell>
                        <TableCell className="pr-6">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${o.id}`); }}>View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-2 px-4 md:hidden">
                {paged.map((o) => (
                  <button key={o.id} onClick={() => navigate(`/orders/${o.id}`)} className="block w-full rounded-lg border border-border bg-card p-3 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold">#{o.number}</span>
                      <HealthBadge health={o.health} size="sm" />
                    </div>
                    <p className="mt-1 text-sm font-medium">{o.customer}</p>
                    <p className="truncate text-xs text-muted-foreground">{o.product}</p>
                    <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{o.created} · ${o.amount.toFixed(2)}</span>
                      <StatusBadge status={o.status} />
                    </div>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-border px-6 py-3 text-sm">
                <p className="text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} of {rows.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <span className="text-xs text-muted-foreground">Page {page} / {pageCount}</span>
                  <Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage((p) => p + 1)}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}