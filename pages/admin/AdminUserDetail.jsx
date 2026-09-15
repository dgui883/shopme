import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import StatusBadge from '@/components/shopme/StatusBadge';
import ConfirmDialog from '@/components/shopme/ConfirmDialog';
import EmptyState from '@/components/shopme/EmptyState';
import { userService } from '@/services/userService';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft, UserX, Ban, UserCheck, Plug, RefreshCw, Mail, Store as StoreIcon, KeyRound, ShieldAlert,
} from 'lucide-react';

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('active');
  const [confirm, setConfirm] = useState({ open: false, action: null });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    userService.getById(id).then((u) => {
      if (!mounted) return;
      setUser(u);
      setStatus(u.status);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [id]);

  const runAction = async (action) => {
    const labels = {
      suspend: 'User suspended', ban: 'User banned', reactivate: 'User reactivated',
      disconnect: 'Shopify disconnected', reset: 'License reset',
    };
    try {
      if (['suspend', 'ban', 'reactivate'].includes(action)) {
        await userService.setStatus(user.id, action);
        if (action === 'suspend') setStatus('suspended');
        if (action === 'ban') setStatus('banned');
        if (action === 'reactivate') setStatus('active');
      } else if (action === 'disconnect' && user.storeId) {
        await userService.disconnectStore(user.storeId);
        setUser((u) => ({ ...u, store: { ...u.store, status: 'disconnected' } }));
      }
      toast({ title: labels[action] || 'Action completed' });
    } catch (err) {
      toast({ title: 'Action failed', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div>
      </div>
    );
  }
  if (!user) return <EmptyState title="User not found" action={<Button asChild><Link to="/admin/users">Back to users</Link></Button>} />;

  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('');

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="mb-1 -ml-2 text-muted-foreground">
        <Link to="/admin/users"><ArrowLeft className="h-4 w-4" /> Back to users</Link>
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">{user.name}</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-1.5"><StatusBadge status={status} /></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User info */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="h-4 w-4" /> User information</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {[
              { label: 'Name', value: user.name },
              { label: 'Email', value: user.email },
              { label: 'Account status', value: <StatusBadge status={status} /> },
              { label: 'Activation date', value: user.activated },
              { label: 'Last login', value: user.lastLogin },
            ].map((r, i, arr) => (
              <div key={r.label}>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-muted-foreground">{r.label}</span>
                  <span className="text-sm font-medium text-foreground">{r.value}</span>
                </div>
                {i < arr.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Shopify connection */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><StoreIcon className="h-4 w-4" /> Shopify connection</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {[
              { label: 'Store URL', value: <span className="font-mono text-xs">{user.store.url}</span> },
              { label: 'Connection status', value: <StatusBadge status={user.store.status} /> },
              { label: 'Connected date', value: user.store.connectedDate },
            ].map((r, i, arr) => (
              <div key={r.label}>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-muted-foreground">{r.label}</span>
                  <span className="text-sm font-medium text-foreground">{r.value}</span>
                </div>
                {i < arr.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* License */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> License</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {[
              { label: 'Activation code', value: <span className="font-mono text-xs">{user.license.code}</span> },
              { label: 'License status', value: <StatusBadge status={user.license.status} /> },
              { label: 'Created date', value: user.license.createdDate },
            ].map((r, i, arr) => (
              <div key={r.label}>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-muted-foreground">{r.label}</span>
                  <span className="text-sm font-medium text-foreground">{r.value}</span>
                </div>
                {i < arr.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Admin actions */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Admin actions</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {status !== 'suspended' && status !== 'banned' && (
              <Button variant="outline" className="w-full justify-start" onClick={() => setConfirm({ open: true, action: 'suspend' })}>
                <UserX className="h-4 w-4" /> Suspend User
              </Button>
            )}
            {status !== 'banned' && (
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" onClick={() => setConfirm({ open: true, action: 'ban' })}>
                <Ban className="h-4 w-4" /> Ban User
              </Button>
            )}
            {status !== 'active' && (
              <Button variant="outline" className="w-full justify-start text-emerald-600 hover:text-emerald-600" onClick={() => setConfirm({ open: true, action: 'reactivate' })}>
                <UserCheck className="h-4 w-4" /> Reactivate User
              </Button>
            )}
            <Separator className="my-1" />
            <Button variant="outline" className="w-full justify-start" onClick={() => setConfirm({ open: true, action: 'disconnect' })}>
              <Plug className="h-4 w-4" /> Disconnect Shopify
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setConfirm({ open: true, action: 'reset' })}>
              <RefreshCw className="h-4 w-4" /> Reset License
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => toast({ title: 'Email sent', description: `Message sent to ${user.email}` })}>
              <Mail className="h-4 w-4" /> Send email
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(o) => setConfirm((c) => ({ ...c, open: o }))}
        title={confirmTitle(confirm.action)}
        description={confirmDesc(confirm.action)}
        confirmLabel={confirmLabel(confirm.action)}
        destructive={['ban', 'suspend', 'disconnect', 'reset'].includes(confirm.action)}
        onConfirm={() => runAction(confirm.action)}
      />
    </div>
  );
}

function confirmTitle(a) {
  return ({ suspend: 'Suspend this user?', ban: 'Ban this user?', reactivate: 'Reactivate this user?', disconnect: 'Disconnect Shopify?', reset: 'Reset license?' }[a] || 'Confirm action');
}
function confirmDesc(a) {
  return ({
    suspend: 'The user will lose access to SHOPME until reactivated.',
    ban: 'This permanently revokes access. The user will not be able to sign in.',
    reactivate: 'The user will regain full access to SHOPME.',
    disconnect: 'Their Shopify store will be unlinked and monitoring will stop.',
    reset: 'A new activation code will be generated and the old one invalidated.',
  }[a] || '');
}
function confirmLabel(a) {
  return ({ suspend: 'Suspend', ban: 'Ban', reactivate: 'Reactivate', disconnect: 'Disconnect', reset: 'Reset' }[a] || 'Confirm');
}