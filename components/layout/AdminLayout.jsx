import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDemoAuth } from '@/context/DemoAuthContext';
import Logo from '@/components/shopme/Logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard, Users, KeyRound, Store as StoreIcon, Activity, Settings, LogOut, Menu, X, ShieldCheck, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/licenses', label: 'Licenses', icon: KeyRound },
  { to: '/admin/stores', label: 'Stores', icon: StoreIcon },
  { to: '/admin/activity', label: 'Activity', icon: Activity },
];

export default function AdminLayout() {
  const { user, logout, enterCustomer } = useDemoAuth();
  const navigate = useNavigate();
  const [mobileNav, setMobileNav] = useState(false);
  const initials = 'AM';

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <Logo />
        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
          Admin
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileNav(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">SHOPME Admin</p>
          <p className="mt-0.5">Manage users & licenses</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border bg-card/25 backdrop-blur-xl lg:block">
        {SidebarContent}
      </aside>

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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/25 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-muted-foreground" onClick={() => setMobileNav(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm font-semibold text-foreground">SHOPME Admin</p>
              <p className="hidden text-xs text-muted-foreground sm:block">Manage users, licenses, and connected Shopify stores.</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-2 transition hover:shadow-soft">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:block">Admin</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Admin account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { enterCustomer(); navigate('/dashboard'); }}>
                <User className="h-4 w-4" /> Switch to customer view
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { logout(); navigate('/'); }} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}