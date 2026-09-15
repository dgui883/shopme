import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/shopme/Logo';
import { useDemoAuth } from '@/context/DemoAuthContext';
import { ShieldCheck, Loader2, Lock } from 'lucide-react';

export default function ShopifyConnect() {
  const { connectShopify } = useDemoAuth();
  const [storeUrl, setStoreUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalize = (v) => {
    let s = v.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (s && !s.includes('.')) s = `${s}.myshopify.com`;
    return s;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const url = normalize(storeUrl);
    if (!url) {
      setError('Please enter your store\'s myshopify.com URL.');
      return;
    }
    setLoading(true);
    try {
      // This navigates away to Shopify's authorization page — on approval,
      // Shopify redirects back to our OAuth callback, which then sends the
      // browser to /dashboard.
      await connectShopify(url);
    } catch (err) {
      setError(err.message || 'Could not start the Shopify connection. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="px-6 py-8">
        <Link to="/"><Logo /></Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            {/* Shopify-style header */}
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-600 text-white">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M5 7h14l-1 9.5a2 2 0 0 1-2 1.8H8a2 2 0 0 1-2-1.8L5 7Zm4 2V7.2a3 3 0 0 1 6 0V9"/></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">Connect to Shopify</p>
                <p className="text-xs text-emerald-700">SHOPME · Secure OAuth connection</p>
              </div>
            </div>

            <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">Connect your Shopify store</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect your Shopify store to let SHOPME monitor orders and store activity.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="store">Shopify Store</Label>
                <div className="relative">
                  <Input
                    id="store"
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                    placeholder="your-store.myshopify.com"
                    className="pr-10"
                    autoFocus
                  />
                  <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Enter your store's myshopify.com URL.</p>
              </div>
              <Button type="submit" className="h-11 w-full" disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</>
                ) : (
                  'Continue to Shopify'
                )}
              </Button>
            </form>

            <div className="mt-5 flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-xs text-muted-foreground">
                SHOPME only accesses information you authorize. This is a frontend-only demo — no real Shopify data is accessed.
              </p>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}