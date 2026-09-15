/**
 * orderService
 * Reads go straight through Supabase — RLS (orders_select_own) guarantees
 * a customer only ever sees orders belonging to their own connected store(s);
 * admins see everything via the is_admin() branch. Message generation is a
 * privileged action and goes through messages-generate.js.
 */
import { supabase } from '@/lib/supabaseClient';
import { callFunction } from '@/lib/functionsClient';

function shortDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function longDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function timeAgo(iso) {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function deriveStatus(o) {
  if (o.order_status === 'cancelled') return 'cancelled';
  if (o.fulfillment_status === 'fulfilled') return 'fulfilled';
  if (o.health_status !== 'healthy') return 'delayed';
  return 'unfulfilled';
}

function recommendationFor(o) {
  if (o.health_status === 'critical') return 'This needs attention now — contact the customer and follow up with the carrier.';
  if (o.health_status === 'needs_attention') return 'Monitor this order and consider a proactive update to the customer.';
  return null;
}

function shapeOrder(o) {
  return {
    id: o.id,
    number: o.order_number,
    customer: o.customer_name || '—',
    email: o.customer_email || '—',
    date: shortDate(o.created_at),
    amount: Number(o.total_price || 0),
    status: deriveStatus(o),
    health: o.health_status,
    product: o.order_items?.[0]?.product_title || '—',
    created: longDate(o.created_at),
    carrier: o.carrier,
    tracking: o.tracking_number,
    lastUpdate: o.last_tracking_update ? timeAgo(o.last_tracking_update) : '—',
    issue: o.health_reason,
    recommended: recommendationFor(o),
  };
}

function formatAddress(addr) {
  if (!addr) return '—';
  const parts = [addr.address1, addr.city, [addr.province, addr.zip].filter(Boolean).join(' '), addr.country]
    .filter(Boolean);
  return parts.join(', ') || '—';
}

export const orderService = {
  async list({ search = '', filter = 'all', sort = 'newest' } = {}) {
    let query = supabase.from('orders').select('*, order_items(product_title)');

    if (filter !== 'all') {
      if (['healthy', 'needs_attention', 'critical'].includes(filter)) {
        query = query.eq('health_status', filter);
      }
    }

    const { data, error } = await query;
    if (error) throw new Error('Could not load orders.');

    let rows = (data || []).map(shapeOrder);

    if (filter !== 'all' && !['healthy', 'needs_attention', 'critical'].includes(filter)) {
      rows = rows.filter((o) => o.status === filter);
    }

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (o) =>
          String(o.number).toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.product.toLowerCase().includes(q)
      );
    }

    rows.sort((a, b) => {
      if (sort === 'oldest') return new Date(a.created) - new Date(b.created);
      if (sort === 'amount-high') return b.amount - a.amount;
      if (sort === 'amount-low') return a.amount - b.amount;
      return new Date(b.created) - new Date(a.created); // newest
    });

    return rows;
  },

  async getById(id) {
    const { data: o, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .maybeSingle();
    if (error || !o) return null;

    const base = shapeOrder(o);

    const timeline = [
      { id: 't1', label: 'Order placed', time: longDate(o.created_at), done: true },
      ...(o.fulfilled_at
        ? [{ id: 't2', label: 'Fulfillment started', time: longDate(o.fulfilled_at), done: true }]
        : []),
      ...(o.last_tracking_update
        ? [{
            id: 't3',
            label: 'Last tracking update',
            time: longDate(o.last_tracking_update),
            done: true,
            warning: o.health_status !== 'healthy',
          }]
        : []),
    ];

    const products = (o.order_items || []).map((li) => ({
      id: li.id,
      name: li.product_title,
      quantity: li.quantity,
      price: Number(li.price || 0),
      image: li.image_url || `https://picsum.photos/seed/${li.id}/200/200`,
    }));

    return {
      ...base,
      timeline,
      products,
      shipping: {
        address: formatAddress(o.shipping_address),
        carrier: o.carrier || '—',
        tracking: o.tracking_number || '—',
        trackingStatus: o.health_status === 'healthy' ? 'In transit' : 'No recent updates',
      },
    };
  },

  async getHealth() {
    const { data, error } = await supabase.from('orders').select('health_status');
    if (error || !data?.length) return { healthy: 0, needsAttention: 0, critical: 0 };
    const total = data.length;
    const count = (s) => data.filter((o) => o.health_status === s).length;
    return {
      healthy: Math.round((count('healthy') / total) * 100),
      needsAttention: Math.round((count('needs_attention') / total) * 100),
      critical: Math.round((count('critical') / total) * 100),
    };
  },

  async getIssues() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .neq('health_status', 'healthy')
      .order('updated_at', { ascending: false })
      .limit(10);
    if (error) return [];
    return (data || []).map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      title: o.health_reason || 'Needs attention',
      customer: o.customer_name || '—',
      customerEmail: o.customer_email || '—',
      orderValue: Number(o.total_price || 0),
      meta: o.last_tracking_update ? timeAgo(o.last_tracking_update) : '—',
      metaLabel: 'Last update',
      priority: o.health_status,
    }));
  },

  async getDashboardStats() {
    const { data, error } = await supabase.from('orders').select('health_status, total_price, created_at');
    if (error || !data) {
      return {
        totalOrders: { value: 0, delta: '', trend: 'flat', sub: 'all time' },
        needsAttention: { value: 0, delta: '', trend: 'flat', sub: 'orders' },
        criticalIssues: { value: 0, delta: '', trend: 'flat', sub: 'critical issues' },
        revenue: { value: '$0', delta: '', trend: 'flat', sub: 'all time' },
      };
    }
    const needsAttention = data.filter((o) => o.health_status === 'needs_attention').length;
    const critical = data.filter((o) => o.health_status === 'critical').length;
    const revenue = data.reduce((sum, o) => sum + Number(o.total_price || 0), 0);

    return {
      totalOrders: { value: data.length, delta: '', trend: 'flat', sub: 'all time' },
      needsAttention: { value: needsAttention, delta: '', trend: 'flat', sub: 'orders' },
      criticalIssues: { value: critical, delta: critical > 0 ? 'Requires action' : 'All clear', trend: 'flat', sub: 'critical issues' },
      revenue: { value: `$${revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, delta: '', trend: 'flat', sub: 'all time' },
    };
  },

  async getRevenueSeries(days = 14) {
    const { data, error } = await supabase.from('orders').select('total_price, created_at');
    if (error || !data) return [];
    const buckets = {};
    for (const o of data) {
      const day = new Date(o.created_at).toISOString().slice(0, 10);
      buckets[day] = (buckets[day] || 0) + Number(o.total_price || 0);
    }
    return Object.entries(buckets)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-days)
      .map(([date, revenue]) => ({ date, revenue: Math.round(revenue) }));
  },

  /** Generates a draft customer message via the backend AI provider abstraction. */
  async draftMessage(order) {
    const { message } = await callFunction('messages-generate', { body: { order_id: order.id } });
    return message;
  },
};
