import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from '@/components/shopme/Logo';
import { useDemoAuth } from '@/context/DemoAuthContext';
import {
  ArrowRight, Package, AlertTriangle, ShieldCheck, Activity, MessageSquare, Store as StoreIcon,
  CheckCircle2, Clock, Search, Bell, ChevronRight, Zap,
} from 'lucide-react';

const PROBLEMS = [
  { icon: Clock, title: 'Orders stuck in processing', desc: 'Fulfillment stalled and nobody noticed until the customer asked.' },
  { icon: Search, title: "Tracking hasn't updated", desc: 'Shipments go quiet for days with no fresh carrier scans.' },
  { icon: AlertTriangle, title: 'Delivery delays', desc: 'Packages sit at carrier facilities longer than they should.' },
  { icon: MessageSquare, title: 'Customers asking for updates', desc: 'Support gets flooded with "where is my order?" messages.' },
  { icon: Bell, title: 'Orders requiring attention', desc: 'A handful of orders need action — buried among hundreds of normal ones.' },
  { icon: ShieldCheck, title: 'Important issues buried', desc: 'Critical problems hide inside a wall of healthy orders.' },
];

const FEATURES = [
  { icon: Package, title: 'Order Monitoring', desc: 'Keep track of orders and identify orders that may require attention.' },
  { icon: Bell, title: 'Smart Alerts', desc: 'Surface important problems instead of making users search through hundreds of orders.' },
  { icon: ShieldCheck, title: 'Order Health', desc: 'Every order gets a simple health state: Healthy, Needs Attention, or Critical.' },
  { icon: MessageSquare, title: 'Customer Communication', desc: 'Prepare helpful customer messages for common order problems.' },
  { icon: StoreIcon, title: 'Store Overview', desc: 'Give the store owner a clear picture of what is happening.' },
  { icon: Activity, title: 'Activity', desc: 'Keep track of important events and actions across your store.' },
];

function DashboardMockup() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-float">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <div className="ml-3 flex items-center gap-2">
          <Logo size="sm" showWordmark={false} />
          <span className="text-xs font-semibold text-foreground">SHOPME</span>
        </div>
      </div>
      <div className="grid grid-cols-12">
        {/* sidebar */}
        <div className="col-span-3 hidden border-r border-border p-3 sm:block">
          <div className="space-y-1">
            {['Dashboard', 'Orders', 'Store', 'Settings'].map((l, i) => (
              <div key={l} className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ${i === 0 ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-primary' : 'bg-border'}`} />
                {l}
              </div>
            ))}
          </div>
        </div>
        {/* content */}
        <div className="col-span-12 p-4 sm:col-span-9">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { l: 'Total Orders', v: '1,284', d: '+12.4%', up: true },
              { l: 'Needs Attention', v: '17', d: '-4', up: false },
              { l: 'Critical', v: '3', d: 'Action', up: false },
              { l: 'Revenue', v: '$48.2k', d: '+8.2%', up: true },
            ].map((s) => (
              <div key={s.l} className="rounded-lg border border-border bg-card p-3">
                <p className="text-[10px] text-muted-foreground">{s.l}</p>
                <p className="mt-1 text-lg font-bold tracking-tight">{s.v}</p>
                <p className={`text-[10px] font-medium ${s.up ? 'text-emerald-600' : 'text-amber-600'}`}>{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-3 lg:col-span-2">
              <p className="text-xs font-semibold text-foreground">Order Health</p>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full">
                <span className="bg-emerald-500" style={{ width: '94%' }} />
                <span className="bg-amber-500" style={{ width: '5%' }} />
                <span className="bg-red-500" style={{ width: '1%' }} />
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Healthy 94%</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Attention 5%</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Critical 1%</span>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs font-semibold text-foreground">Recent Activity</p>
              <div className="mt-2 space-y-1.5">
                {['Order #10491 fulfilled', 'Tracking updated for #10482', 'Order #10471 flagged'].map((a, i) => (
                  <div key={a} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <CheckCircle2 className={`h-3 w-3 ${i === 2 ? 'text-amber-500' : 'text-emerald-500'}`} />
                    {a}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { login } = useDemoAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const connectShopify = () => {
    login();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#problem" className="transition hover:text-foreground">Problem</a>
            <a href="#solution" className="transition hover:text-foreground">Solution</a>
            <a href="#features" className="transition hover:text-foreground">Features</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={() => navigate('/login')}>Sign in</Button>
            <Button size="sm" onClick={connectShopify}>Connect Shopify</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.4] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Shopify operations, simplified
            </div>
            <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl" style={{ letterSpacing: '-0.03em' }}>
              Run your Shopify store with less work.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
              SHOPME helps you monitor your orders, spot problems early, and keep your store running smoothly from one powerful dashboard.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="h-11 px-6" onClick={connectShopify}>
                Connect Shopify <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-11 px-6" onClick={() => navigate('/login')}>
                See how it works
              </Button>
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-5xl">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">The problem</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl" style={{ letterSpacing: '-0.02em' }}>
              Your store shouldn't require constant checking.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Most order problems don't announce themselves. They hide inside hundreds of normal, healthy orders — until a customer emails.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="rounded-xl border border-border bg-card p-5 shadow-soft transition hover:shadow-soft-md">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600">
                  <p.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{p.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section id="solution" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">The solution</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl" style={{ letterSpacing: '-0.02em' }}>
              SHOPME watches the important stuff for you.
            </h2>
            <p className="mt-4 text-muted-foreground">
              SHOPME is designed to monitor your Shopify store and bring important issues to the owner's attention instead of forcing them to manually inspect every order.
            </p>
          </div>

          {/* process flow */}
          <div className="mt-12 flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
            {[
              { label: 'Shopify Store', icon: StoreIcon, color: 'bg-emerald-50 text-emerald-600' },
              { label: 'SHOPME', icon: Zap, color: 'bg-primary/10 text-primary' },
              { label: 'Detect Problems', icon: AlertTriangle, color: 'bg-amber-50 text-amber-600' },
              { label: 'Take Action', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
            ].map((step, i, arr) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${step.color}`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex justify-center text-muted-foreground lg:px-1">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Features</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl" style={{ letterSpacing: '-0.02em' }}>
              Everything you need to keep orders healthy.
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-soft-md">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="relative overflow-hidden rounded-2xl bg-foreground px-6 py-14 text-center text-background sm:px-12">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-10" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ letterSpacing: '-0.02em' }}>
                Spend less time checking your store.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-background/70">
                Connect your Shopify store and let SHOPME surface what actually needs your attention.
              </p>
              <Button size="lg" className="mt-8 h-11 px-6" onClick={connectShopify}>
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-sm text-muted-foreground">© 2026 SHOPME. All rights reserved.</p>
          <div className="flex gap-5 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
            <Link to="/activate" className="hover:text-foreground">Activate</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}