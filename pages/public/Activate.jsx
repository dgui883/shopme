import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/shopme/Logo';
import { useDemoAuth } from '@/context/DemoAuthContext';
import { CheckCircle2, ArrowRight, KeyRound, Sparkles } from 'lucide-react';

export default function Activate() {
  const navigate = useNavigate();
  const { activate } = useDemoAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await activate(code.trim());
      setDone(true);
    } catch (err) {
      setError(err.message || 'Could not activate this code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">You're all set.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your SHOPME account is activated. Connect your Shopify store to continue.
          </p>
          <Button className="mt-6 h-11 w-full" onClick={() => navigate('/connect-shopify')}>
            Connect Shopify <ArrowRight className="h-4 w-4" />
          </Button>
          <Link to="/login" className="mt-4 inline-block text-sm font-medium text-muted-foreground hover:text-foreground">
            Already activated? Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="px-6 py-8">
        <Link to="/"><Logo /></Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">Activate your SHOPME account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter the activation code you received to get started.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">Activation Code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(''); }}
                  placeholder="SHPME-XXXX-XXXX-XXXX"
                  className="font-mono tracking-wide"
                  autoFocus
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
              <Button type="submit" className="h-11 w-full" disabled={loading}>
                {loading ? 'Activating…' : 'Activate'}
              </Button>
            </form>


          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already activated?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}