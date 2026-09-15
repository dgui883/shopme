import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/shopme/Logo';
import { useDemoAuth } from '@/context/DemoAuthContext';
import { ShieldCheck, Package, Activity, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useDemoAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Could not sign in. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left form */}
      <div className="flex min-h-screen flex-col justify-between px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <Link to="/activate" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Activate account
          </Link>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your SHOPME dashboard.</p>

          {error && (
            <div className="mt-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs font-medium text-primary hover:underline">Forgot password?</button>
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" className="h-10 w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to SHOPME?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">Create an account</Link>
            {' '}or{' '}
            <Link to="/activate" className="font-medium text-primary hover:underline">activate your license</Link>
          </p>
        </div>

        <p className="text-xs text-muted-foreground">© 2026 SHOPME</p>
      </div>

      {/* Right visual panel */}
      <div className="relative hidden overflow-hidden bg-foreground lg:block">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-10" />
        <div className="relative flex h-full flex-col justify-center px-12 text-background">
          <Logo tone="light" size="lg" />
          <h2 className="mt-8 max-w-md text-3xl font-bold tracking-tight" style={{ letterSpacing: '-0.02em' }}>
            Your Shopify store. One simple dashboard.
          </h2>
          <p className="mt-4 max-w-md text-background/70">
            Monitor orders, catch problems early, and keep customers happy — without checking every order by hand.
          </p>
          <div className="mt-10 space-y-4">
            {[
              { icon: Package, text: 'Order health monitoring across your whole store' },
              { icon: ShieldCheck, text: 'Smart alerts that surface what actually matters' },
              { icon: Activity, text: 'A clear activity log of everything that happens' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-background/10">
                  <f.icon className="h-4.5 w-4.5" />
                </div>
                <span className="text-sm text-background/80">{f.text}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/activate')} className="mt-12 inline-flex items-center gap-1.5 text-sm font-medium text-background/80 hover:text-background">
            Learn how it works <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}