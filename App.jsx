import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { DemoAuthProvider, useDemoAuth } from '@/context/DemoAuthContext';
import DemoSwitcher from '@/components/shopme/DemoSwitcher';

import CustomerLayout from '@/components/layout/CustomerLayout';
import AdminLayout from '@/components/layout/AdminLayout';

import Landing from '@/pages/public/Landing';
import Login from '@/pages/public/Login';
import Register from '@/pages/Register';
import Activate from '@/pages/public/Activate';
import ShopifyConnect from '@/pages/public/ShopifyConnect';

import Dashboard from '@/pages/customer/Dashboard';
import Orders from '@/pages/customer/Orders';
import OrderDetail from '@/pages/customer/OrderDetail';
import Store from '@/pages/customer/Store';
import Settings from '@/pages/customer/Settings';

import AdminOverview from '@/pages/admin/AdminOverview';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminUserDetail from '@/pages/admin/AdminUserDetail';
import AdminLicenses from '@/pages/admin/AdminLicenses';
import AdminStores from '@/pages/admin/AdminStores';
import AdminActivity from '@/pages/admin/AdminActivity';
import AdminLogin from '@/components/AdminLogin';

function FullPageSpinner() {
  return (
    <div className="fixed inset-0 grid place-items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
    </div>
  );
}

function RequireConnected() {
  const { isAuthenticated, ready } = useDemoAuth();
  if (!ready) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RequireAdmin() {
  const { isAdmin, ready } = useDemoAuth();
  if (!ready) return <FullPageSpinner />;
  if (!isAdmin) return <AdminLogin />;
  return <Outlet />;
}

function AppShell() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/activate" element={<Activate />} />
        <Route path="/connect-shopify" element={<ShopifyConnect />} />

        {/* Customer */}
        <Route element={<RequireConnected />}>
          <Route element={<CustomerLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/store" element={<Store />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/users/:id" element={<AdminUserDetail />} />
            <Route path="/admin/licenses" element={<AdminLicenses />} />
            <Route path="/admin/stores" element={<AdminStores />} />
            <Route path="/admin/activity" element={<AdminActivity />} />
          </Route>
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
      {import.meta.env.DEV && <DemoSwitcher />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <DemoAuthProvider>
            <AppShell />
          </DemoAuthProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;