import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import PageHeader from '@/components/shopme/PageHeader';
import StatusBadge from '@/components/shopme/StatusBadge';
import EmptyState from '@/components/shopme/EmptyState';
import { licenseService } from '@/services/licenseService';
import { useToast } from '@/components/ui/use-toast';
import { KeyRound, Plus, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const COUNTS = [1, 5, 10, 50];

export default function AdminLicenses() {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    licenseService.list().then((r) => { setRows(r); setLoading(false); });
  }, []);

  const generate = async () => {
    setGenerating(true);
    const codes = await licenseService.generate(count);
    setGenerating(false);
    setRows((r) => [...codes, ...r]);
    setGenerated(codes);
    toast({ title: `${count} license${count > 1 ? 's' : ''} created` });
  };

  const copy = async (code, id) => {
    try { await navigator.clipboard.writeText(code); setCopiedId(id); setTimeout(() => setCopiedId(null), 1200); } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Licenses" description="Generate and manage activation codes.">
        <Button onClick={() => { setGenerated([]); setCount(5); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Create License
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="px-0">
          {loading ? (
            <div className="space-y-2 px-6 py-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : rows.length === 0 ? (
            <EmptyState className="mx-6 my-6" icon={KeyRound} title="No licenses yet" description="Create your first activation code." />
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Activation Code</TableHead>
                      <TableHead>Assigned User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Activated</TableHead>
                      <TableHead className="pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="pl-6 font-mono text-xs font-medium">{l.code}</TableCell>
                        <TableCell className="text-muted-foreground">{l.assignedUser}</TableCell>
                        <TableCell><StatusBadge status={l.status} /></TableCell>
                        <TableCell className="text-muted-foreground">{l.created}</TableCell>
                        <TableCell className="text-muted-foreground">{l.activated}</TableCell>
                        <TableCell className="pr-6">
                          <Button variant="ghost" size="sm" onClick={() => copy(l.code, l.id)}>
                            {copiedId === l.id ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-2 px-4 md:hidden">
                {rows.map((l) => (
                  <div key={l.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold">{l.code}</span>
                      <StatusBadge status={l.status} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">Assigned: {l.assignedUser}</p>
                    <p className="text-xs text-muted-foreground">Created: {l.created}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create License modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create License</DialogTitle>
            <DialogDescription>Generate activation codes to distribute to customers.</DialogDescription>
          </DialogHeader>

          {generated.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Generated codes</p>
              <div className="space-y-2">
                {generated.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <span className="font-mono text-sm">{c.code}</span>
                    <Button variant="ghost" size="sm" onClick={() => copy(c.code, c.id)}>
                      {copiedId === c.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Number of codes</p>
              <div className="grid grid-cols-4 gap-2">
                {COUNTS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCount(c)}
                    className={cn(
                      'rounded-lg border py-2.5 text-sm font-semibold transition',
                      count === c ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>{generated.length > 0 ? 'Done' : 'Cancel'}</Button>
            {generated.length === 0 && (
              <Button onClick={generate} disabled={generating}>
                {generating ? 'Generating…' : `Generate ${count} code${count > 1 ? 's' : ''}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}