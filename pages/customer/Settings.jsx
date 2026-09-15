import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import PageHeader from '@/components/shopme/PageHeader';
import ConfirmDialog from '@/components/shopme/ConfirmDialog';
import { shopifyService } from '@/services/shopifyService';
import { useToast } from '@/components/ui/use-toast';
import { User, Bell, ShoppingBag, Sliders, Save, Plug } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { value: 'account', label: 'Account', icon: User },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'shopify', label: 'Shopify', icon: ShoppingBag },
  { value: 'preferences', label: 'Preferences', icon: Sliders },
];

function Row({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const [tab, setTab] = useState('account');
  const [notif, setNotif] = useState({ delays: true, critical: true, fulfillment: true, daily: false });
  const [prefs, setPrefs] = useState({ timezone: 'UTC', currency: 'USD', date: 'MMM D, YYYY' });
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [conn, setConn] = useState(null);

  useEffect(() => {
    shopifyService.getConnection().then(setConn);
  }, []);

  const save = (msg = 'Settings saved') => {
    toast({ title: msg, description: 'Your changes have been saved.' });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account, notifications, and Shopify preferences." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Tabs nav */}
        <nav className="lg:col-span-1">
          <div className="flex gap-1 overflow-x-auto lg:flex-col">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition whitespace-nowrap',
                  tab === t.value ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader><CardTitle className="capitalize">{tab}</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {tab === 'account' && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Name</Label>
                      <Input defaultValue="Alex Morgan" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input defaultValue="alex@example.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Password</Label>
                      <Input type="password" defaultValue="demo1234" />
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-end">
                    <Button onClick={() => save('Account updated')}><Save className="h-4 w-4" /> Save changes</Button>
                  </div>
                </>
              )}

              {tab === 'notifications' && (
                <>
                  <Row label="Order delays" description="Get notified when an order is delayed beyond its window.">
                    <Switch checked={notif.delays} onCheckedChange={(v) => setNotif((n) => ({ ...n, delays: v }))} />
                  </Row>
                  <Separator />
                  <Row label="Critical issues" description="Alert me immediately about critical order problems.">
                    <Switch checked={notif.critical} onCheckedChange={(v) => setNotif((n) => ({ ...n, critical: v }))} />
                  </Row>
                  <Separator />
                  <Row label="Fulfillment problems" description="Notifications for fulfillment issues.">
                    <Switch checked={notif.fulfillment} onCheckedChange={(v) => setNotif((n) => ({ ...n, fulfillment: v }))} />
                  </Row>
                  <Separator />
                  <Row label="Daily summary" description="A daily digest of your store's health.">
                    <Switch checked={notif.daily} onCheckedChange={(v) => setNotif((n) => ({ ...n, daily: v }))} />
                  </Row>
                  <Separator className="my-4" />
                  <div className="flex justify-end"><Button onClick={() => save('Notifications updated')}>Save changes</Button></div>
                </>
              )}

              {tab === 'shopify' && (
                <>
                  <Row label="Connected store" description="The Shopify store currently linked to your account.">
                    <span className="text-sm font-medium text-foreground">{conn?.storeUrl ?? "—"}</span>
                  </Row>
                  <Separator />
                  <Row label="Connection status" description="Whether SHOPME can access your store.">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
                    </span>
                  </Row>
                  <Separator />
                  <Row label="Access token" description="Your Shopify access token is stored securely server-side.">
                    <span className="font-mono text-sm text-muted-foreground">{conn?.accessToken ?? "—"}</span>
                  </Row>
                  <Separator className="my-4" />
                  <div className="flex justify-end">
                    <Button variant="destructive" onClick={() => setConfirmDisconnect(true)}>
                      <Plug className="h-4 w-4" /> Disconnect Shopify
                    </Button>
                  </div>
                </>
              )}

              {tab === 'preferences' && (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label>Timezone</Label>
                      <Select value={prefs.timezone} onValueChange={(v) => setPrefs((p) => ({ ...p, timezone: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="EST">EST (UTC-5)</SelectItem>
                          <SelectItem value="PST">PST (UTC-8)</SelectItem>
                          <SelectItem value="GMT">GMT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Currency</Label>
                      <Select value={prefs.currency} onValueChange={(v) => setPrefs((p) => ({ ...p, currency: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date format</Label>
                      <Select value={prefs.date} onValueChange={(v) => setPrefs((p) => ({ ...p, date: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MMM D, YYYY">Sep 14, 2026</SelectItem>
                          <SelectItem value="DD/MM/YYYY">14/09/2026</SelectItem>
                          <SelectItem value="MM/DD/YYYY">09/14/2026</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-end"><Button onClick={() => save('Preferences updated')}>Save changes</Button></div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDisconnect}
        onOpenChange={setConfirmDisconnect}
        title="Disconnect Shopify?"
        description="You'll stop monitoring orders and store activity. You can reconnect anytime."
        confirmLabel="Disconnect"
        destructive
        onConfirm={() => save('Shopify disconnected')}
      />
    </div>
  );
}