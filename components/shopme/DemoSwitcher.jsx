import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoAuth } from '@/context/DemoAuthContext';
import { Button } from '@/components/ui/button';
import { Sparkles, X, ShieldCheck, User, LogOut, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Dev-only floating switcher to jump between the customer and admin
 * experiences while building the frontend. Not part of the real product.
 */
export default function DemoSwitcher() {
  const [open, setOpen] = useState(false);
  const { role, enterAdmin, enterCustomer, logout, isAuthenticated } = useDemoAuth();
  const navigate = useNavigate();

  const go = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] print:hidden">
      {open && (
        <div className="mb-2 w-64 rounded-xl border border-border bg-popover p-3 shadow-float">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Demo controls
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-1.5">
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => { enterCustomer(); go('/dashboard'); }}>
              <User className="h-4 w-4" /> Customer view
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => { enterAdmin(); go('/admin'); }}>
              <ShieldCheck className="h-4 w-4" /> Admin view
            </Button>
            <div className="my-1 h-px bg-border" />
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => go('/login')}>
              <ArrowRight className="h-4 w-4" /> Login screen
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => go('/activate')}>
              <ArrowRight className="h-4 w-4" /> Activate screen
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => go('/')}>
              <ArrowRight className="h-4 w-4" /> Landing page
            </Button>
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => { logout(); go('/'); }}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            )}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Current: <span className="font-semibold">{role}</span>
          </p>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-semibold shadow-float transition hover:shadow-soft-md',
          open ? 'text-primary' : 'text-foreground'
        )}
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        {open ? 'Close' : 'Demo'}
      </button>
    </div>
  );
}