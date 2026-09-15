import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import PageHeader from '@/components/shopme/PageHeader';
import StatusBadge from '@/components/shopme/StatusBadge';
import EmptyState from '@/components/shopme/EmptyState';
import { userService } from '@/services/userService';
import { Search, Users, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUSES = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'banned', label: 'Banned' },
];

export default function AdminUsers() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    userService.list({ search, status }).then((r) => {
      if (!mounted) return;
      setRows(r);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [search, status]);

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage user accounts and their Shopify connections." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, store…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="px-0">
          {loading ? (
            <div className="space-y-2 px-6 py-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : rows.length === 0 ? (
            <EmptyState className="mx-6 my-6" icon={Users} title="No users found" description="Try adjusting your search or filter." />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Shopify Store</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Activated</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead className="pr-6"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((u) => (
                      <TableRow key={u.id} className="cursor-pointer" onClick={() => navigate(`/admin/users/${u.id}`)}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                {u.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{u.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{u.store}</TableCell>
                        <TableCell><StatusBadge status={u.status} /></TableCell>
                        <TableCell className="text-muted-foreground">{u.activated}</TableCell>
                        <TableCell className="text-muted-foreground">{u.lastActive}</TableCell>
                        <TableCell className="pr-6 text-right">
                          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-2 px-4 md:hidden">
                {rows.map((u) => (
                  <button key={u.id} onClick={() => navigate(`/admin/users/${u.id}`)} className="block w-full rounded-lg border border-border bg-card p-3 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{u.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</AvatarFallback></Avatar>
                        <span className="text-sm font-semibold">{u.name}</span>
                      </div>
                      <StatusBadge status={u.status} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{u.email}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{u.store}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}