import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/shopme/Logo';
import { useDemoAuth } from '@/context/DemoAuthContext';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, isAdmin, logout } = useDemoAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const nextSession = await login(email, password);
      // login() already refreshes the session; re-check role from the
      // freshly-loaded profile rather than trusting anything client-side.
      if (!nextSession?.role || nextSession.role !== 'admin') {
        await logout();
        setError('This account does not have admin access.');
        return;
      }
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/25 p-7 shadow-float backdrop-blur-xl">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">SHOPME Admin</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to manage users, licenses, and stores.</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@shopme.io" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <Input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" className="h-10 w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in to admin'}
            </Button>
          </form>

        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}