import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Image } from '@/components/ui/image';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { HealthBadge } from '@/components/shopme/HealthBadge';
import StatusBadge from '@/components/shopme/StatusBadge';
import EmptyState from '@/components/shopme/EmptyState';
import { orderService } from '@/services/orderService';
import {
  ArrowLeft, AlertTriangle, CheckCircle2, RefreshCw, Copy, Pencil, Mail, MapPin, Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OrderDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    orderService.getById(id).then((o) => {
      if (!mounted) return;
      setOrder(o);
      setLoading(false);
      if (o) orderService.draftMessage(o).then(setMessage);
    });
    return () => { mounted = false; };
  }, [id]);

  const regenerate = async () => {
    if (!order) return;
    setGenerating(true);
    const m = await orderService.draftMessage(order);
    setMessage(m);
    setGenerating(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-64 rounded-xl lg:col-span-2" /><Skeleton className="h-64 rounded-xl" /></div>
      </div>
    );
  }

  if (!order) {
    return <EmptyState title="Order not found" description="This order may have been removed." action={<Button asChild><Link to="/orders">Back to orders</Link></Button>} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2 text-muted-foreground">
          <Link to="/orders"><ArrowLeft className="h-4 w-4" /> Back to orders</Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Order #{order.number}</h1>
            <HealthBadge health={order.health} />
            <StatusBadge status={order.status} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setResolved(true)}>
              <CheckCircle2 className="h-4 w-4" /> {resolved ? 'Resolved' : 'Mark as Resolved'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: timeline, products, shipping */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer */}
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer</p>
                  <p className="mt-1 font-semibold text-foreground">{order.customer}</p>
                  <p className="text-sm text-muted-foreground">{order.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Order value</p>
                  <p className="mt-1 text-xl font-bold tracking-tight">${order.amount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader><CardTitle>Order Timeline</CardTitle></CardHeader>
            <CardContent>
              <ol className="relative space-y-5 before:absolute before:left-[9px] before:top-1.5 before:h-[calc(100%-0.75rem)] before:w-px before:bg-border">
                {order.timeline.map((t, i) => (
                  <li key={t.id} className="relative flex gap-3">
                    <span className={cn(
                      'relative z-10 mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ring-4 ring-card',
                      t.warning ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                    )}>
                      <CheckCircle2 className="h-3 w-3" />
                    </span>
                    <div className="flex flex-1 items-center justify-between gap-2">
                      <span className={cn('text-sm font-medium', t.warning ? 'text-amber-700' : 'text-foreground')}>{t.label}</span>
                      <span className="text-xs text-muted-foreground">{t.time}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader><CardTitle>Products</CardTitle></CardHeader>
            <CardContent className="px-0">
              <div className="divide-y divide-border">
                {order.products.map((p) => (
                  <div key={p.id} className="flex items-center gap-4 px-6 py-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      <Image src={p.image} alt={p.name} fittingType="fill" className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Qty {p.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold">${p.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card>
            <CardHeader><CardTitle>Shipping</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Shipping address</p>
                  <p className="mt-0.5 text-sm text-foreground">{order.shipping.address}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"><Truck className="h-3.5 w-3.5" /> Carrier</p>
                  <p className="mt-1 text-sm text-foreground">{order.shipping.carrier}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tracking number</p>
                  <p className="mt-1 font-mono text-sm text-foreground">{order.shipping.tracking}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tracking status</p>
                  <p className="mt-1 text-sm text-foreground">{order.shipping.trackingStatus}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: problem + AI message */}
        <div className="space-y-6">
          {order.issue && !resolved && (
            <Card className="border-amber-200 bg-amber-50/40">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="text-sm font-semibold">Problem Detected</h3>
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">{order.issue}</p>
                {order.recommended && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-card p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recommended action</p>
                    <p className="mt-1 text-sm text-foreground">{order.recommended}</p>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => { const el = document.getElementById('msg-editor'); el?.scrollIntoView({ behavior: 'smooth' }); }}>
                    <Mail className="h-3.5 w-3.5" /> Draft Customer Message
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setResolved(true)}>Mark as Resolved</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {resolved && (
            <Card className="border-emerald-200 bg-emerald-50/40">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <h3 className="text-sm font-semibold">Issue resolved</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">This order has been marked as resolved.</p>
              </CardContent>
            </Card>
          )}

          {/* AI Message Preview */}
          <Card id="msg-editor">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Customer Message</CardTitle>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">AI Draft</span>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} className="resize-none text-sm" />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={regenerate} disabled={generating}>
                  <RefreshCw className={cn('h-3.5 w-3.5', generating && 'animate-spin')} /> {generating ? 'Regenerating…' : 'Regenerate'}
                </Button>
                <Button size="sm" variant="outline"><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                <Button size="sm" onClick={copy}>
                  <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied!' : 'Copy Message'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Mock message — generated locally for demo purposes.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}