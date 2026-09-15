import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDemoAuth } from '@/context/DemoAuthContext';
import Logo from '@/components/shopme/Logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, Package, Store as StoreIcon, Settings, LogOut, ChevronDown, ShieldCheck, Menu, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/orders', label: 'Orders', icon: Package },
  { to: '/store', label: 'Store', icon: StoreIcon },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function CustomerLayout() {
  const { user, store, logout, enterAdmin } = useDemoAuth();
  const navigate = useNavigate();
  const [mobileNav, setMobileNav] = useState(false);

  const initials = (user?.name || 'A M').split(' ').map((p) => p[0]).slice(0, 2).join('');

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileNav(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <div className="rounded-lg bg-muted/60 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Shopify Connected
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{store?.url || 'demo-store.myshopify.com'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border bg-card/25 backdrop-blur-xl lg:block">
        {SidebarContent}
      </aside>

      {/* Mobile nav drawer */}
      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNav(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-border bg-card/25 backdrop-blur-xl shadow-float">
            <button onClick={() => setMobileNav(false)} className="absolute right-3 top-4 text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/25 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-muted-foreground" onClick={() => setMobileNav(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5">
              <StoreIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{store?.name || 'Demo Store'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="hidden items-center gap-1.5 text-xs font-medium text-emerald-600 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Shopify Connected
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-2 transition hover:shadow-soft">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:block">{user?.name?.split(' ')[0] || 'Alex'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <div className="text-sm font-semibold">{user?.name || 'Alex Morgan'}</div>
                <div className="text-xs font-normal text-muted-foreground">{user?.email || 'alex@example.com'}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/store')}>
                <StoreIcon className="h-4 w-4" /> Store
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { enterAdmin(); navigate('/admin'); }}>
                <ShieldCheck className="h-4 w-4" /> Switch to admin
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { logout(); navigate('/'); }} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-card/25 backdrop-blur-xl px-2 py-1.5 lg:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-0.5 rounded-md py-1.5 text-[11px] font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="h-14 lg:hidden" />
    </div>
  );
}