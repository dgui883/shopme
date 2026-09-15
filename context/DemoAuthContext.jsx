import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { callFunction } from '@/lib/functionsClient';

/**
 * Real Supabase-backed auth/session context.
 * Kept as `DemoAuthContext` / `useDemoAuth` / `DemoAuthProvider` so every
 * existing page and layout component keeps working unchanged — only the
 * internals moved from localStorage mock data to real Supabase Auth +
 * Postgres.
 *
 * Session shape (unchanged from the mock):
 *  status: 'guest' | 'activated' | 'connected'
 *    guest     -> signed in (or not) but no active license yet
 *    activated -> license active, no connected Shopify store yet
 *    connected -> has at least one connected Shopify store
 *  role:   'customer' | 'admin'   (from profiles.role — server is source of truth)
 *  user:   { name, email } | null
 *  store:  { name, url } | null
 */

const DemoAuthContext = createContext(null);

const EMPTY_SESSION = { status: 'guest', role: 'customer', user: null, store: null, banned: false, suspended: false };

async function loadSessionFromSupabase() {
  const { data: { session: authSession } } = await supabase.auth.getSession();
  if (!authSession) return EMPTY_SESSION;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', authSession.user.id)
    .maybeSingle();

  if (!profile) return EMPTY_SESSION;

  if (profile.status === 'banned') {
    return { ...EMPTY_SESSION, banned: true, user: { name: profile.full_name, email: profile.email } };
  }
  if (profile.status === 'suspended') {
    return { ...EMPTY_SESSION, suspended: true, user: { name: profile.full_name, email: profile.email } };
  }

  const { data: license } = await supabase
    .from('licenses')
    .select('id,status')
    .eq('assigned_user_id', profile.id)
    .eq('status', 'active')
    .maybeSingle();

  const { data: store } = await supabase
    .from('shopify_stores')
    .select('shop_domain, shop_name, connection_status')
    .eq('user_id', profile.id)
    .eq('connection_status', 'connected')
    .maybeSingle();

  let status = 'guest';
  if (license) status = 'activated';
  if (store) status = 'connected';

  return {
    status,
    role: profile.role,
    user: { name: profile.full_name || profile.email, email: profile.email },
    store: store ? { name: store.shop_name || store.shop_domain, url: store.shop_domain } : null,
    banned: false,
    suspended: false,
  };
}

export function DemoAuthProvider({ children }) {
  const [session, setSession] = useState(EMPTY_SESSION);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const next = await loadSessionFromSupabase();
    setSession(next);
    return next;
  }, []);

  useEffect(() => {
    refresh().finally(() => setReady(true));

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return refresh();
  }, [refresh]);

  const register = useCallback(async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    if (fullName && data?.user) {
      // Best-effort; profile row is created by the DB trigger, this just adds the name.
      await supabase.from('profiles').update({ full_name: fullName }).eq('auth_user_id', data.user.id);
    }
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(EMPTY_SESSION);
  }, []);

  const activate = useCallback(async (code) => {
    await callFunction('license-activate', { body: { activation_code: code } });
    await refresh();
  }, [refresh]);

  const connectShopify = useCallback(async (shopDomain) => {
    const normalized = shopDomain?.includes('.myshopify.com')
      ? shopDomain.trim().toLowerCase()
      : `${shopDomain.trim().toLowerCase()}.myshopify.com`;
    const { authorize_url } = await callFunction('shopify-oauth-begin', {
      body: { shop_domain: normalized },
    });
    window.location.href = authorize_url; // leaves the SPA — Shopify redirects back after approval
  }, []);

  // Dev-only convenience for jumping between views while building the UI.
  // Has zero effect on real server-side authorization — admin routes and
  // admin API calls always re-check profiles.role from the database.
  const devOnly = import.meta.env.DEV;
  const setRole = useCallback((role) => {
    if (!devOnly) return;
    setSession((s) => ({ ...s, role }));
  }, [devOnly]);
  const enterAdmin = useCallback(() => {
    if (!devOnly) return;
    setSession((s) => ({ ...s, role: 'admin', status: 'connected' }));
  }, [devOnly]);
  const enterCustomer = useCallback(() => {
    if (!devOnly) return;
    setSession((s) => ({ ...s, role: 'customer' }));
  }, [devOnly]);

  const value = {
    ...session,
    ready,
    isAuthenticated: session.status === 'connected',
    isAdmin: session.role === 'admin',
    login,
    register,
    logout,
    activate,
    connectShopify,
    setRole,
    enterAdmin,
    enterCustomer,
    refresh,
  };

  return <DemoAuthContext.Provider value={value}>{children}</DemoAuthContext.Provider>;
}

export function useDemoAuth() {
  const ctx = useContext(DemoAuthContext);
  if (!ctx) throw new Error('useDemoAuth must be used within DemoAuthProvider');
  return ctx;
}
