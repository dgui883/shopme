/**
 * mockData.js
 * Centralized realistic demo data for SHOPME.
 * Every service layer (userService, orderService, ...) reads from here.
 * Replace these arrays/objects with real Supabase / Shopify API calls later —
 * the consuming components depend on the *services*, not on this file directly.
 */

export const store = {
  name: 'Demo Store',
  url: 'demo-store.myshopify.com',
  connectedDate: 'September 14, 2026',
  status: 'connected',
  plan: 'Shopify Plus',
  products: 248,
  orders: 1284,
  customers: 1923,
  inventory: 96,
};

export const dashboardStats = {
  totalOrders: { value: 1284, delta: '+12.4%', trend: 'up', sub: 'vs last month' },
  needsAttention: { value: 17, delta: '-4', trend: 'down', sub: 'from yesterday' },
  criticalIssues: { value: 3, delta: 'Requires action', trend: 'flat', sub: 'critical issues' },
  revenue: { value: '$48,290', delta: '+8.2%', trend: 'up', sub: 'vs last month' },
};

export const orderHealth = {
  healthy: 94,
  needsAttention: 5,
  critical: 1,
};

export const issues = [
  {
    id: 'i1',
    orderNumber: 10482,
    title: "Tracking hasn't updated",
    customer: 'Sarah Johnson',
    customerEmail: 'sarah@example.com',
    orderValue: 84.0,
    meta: 'Last update: 5 days ago',
    metaLabel: 'Last update',
    priority: 'critical',
  },
  {
    id: 'i2',
    orderNumber: 10471,
    title: 'Fulfillment delayed',
    customer: 'Michael Brown',
    customerEmail: 'michael@example.com',
    orderValue: 129.0,
    meta: '4 days',
    metaLabel: 'Waiting',
    priority: 'needs_attention',
  },
  {
    id: 'i3',
    orderNumber: 10463,
    title: 'Possible delivery delay',
    customer: 'Daniel Smith',
    customerEmail: 'daniel@example.com',
    orderValue: 64.5,
    meta: 'USPS · 3 days ago',
    metaLabel: 'Tracking',
    priority: 'needs_attention',
  },
];

export const recentActivity = [
  { id: 'a1', icon: 'check', text: 'Order #10491 fulfilled', time: '2 min ago', tone: 'success' },
  { id: 'a2', icon: 'check', text: 'Tracking updated for #10482', time: '18 min ago', tone: 'success' },
  { id: 'a3', icon: 'alert', text: 'Order #10471 flagged', time: '1 hour ago', tone: 'warning' },
  { id: 'a4', icon: 'message', text: 'Customer message drafted', time: '2 hours ago', tone: 'neutral' },
  { id: 'a5', icon: 'check', text: 'Shopify store connected', time: '5 hours ago', tone: 'success' },
  { id: 'a6', icon: 'check', text: 'Order #10455 fulfilled', time: 'Yesterday', tone: 'success' },
];

export const orders = [
  { id: '10482', number: 10482, customer: 'Sarah Johnson', email: 'sarah@example.com', date: 'Sep 14', amount: 84.0, status: 'fulfilled', health: 'critical', product: 'Linen Throw Blanket', created: 'Sep 9, 2026', carrier: 'USPS', tracking: '9400111899223197', lastUpdate: '5 days ago', issue: "Tracking hasn't updated for 5 days.", recommended: 'Contact the customer and monitor the shipment.' },
  { id: '10471', number: 10471, customer: 'Michael Brown', email: 'michael@example.com', date: 'Sep 13', amount: 129.0, status: 'delayed', health: 'needs_attention', product: 'Ceramic Vase Set', created: 'Sep 9, 2026', carrier: 'UPS', tracking: '1Z999AA10123456784', lastUpdate: '4 days ago', issue: 'Fulfillment delayed beyond expected window.', recommended: 'Check with fulfillment partner and notify the customer.' },
  { id: '10463', number: 10463, customer: 'Daniel Smith', email: 'daniel@example.com', date: 'Sep 13', amount: 64.5, status: 'fulfilled', health: 'needs_attention', product: 'Oak Cutting Board', created: 'Sep 11, 2026', carrier: 'USPS', tracking: '9400111899223201', lastUpdate: '3 days ago', issue: 'Possible delivery delay detected.', recommended: 'Monitor tracking and proactively reach out.' },
  { id: '10491', number: 10491, customer: 'Emma Wilson', email: 'emma@example.com', date: 'Sep 14', amount: 212.0, status: 'fulfilled', health: 'healthy', product: 'Wool Area Rug', created: 'Sep 12, 2026', carrier: 'FedEx', tracking: '7489651230', lastUpdate: '2 hours ago', issue: null, recommended: null },
  { id: '10488', number: 10488, customer: 'James Taylor', email: 'james@example.com', date: 'Sep 14', amount: 47.5, status: 'unfulfilled', health: 'healthy', product: 'Cotton Pillow Cover', created: 'Sep 13, 2026', carrier: null, tracking: null, lastUpdate: '—', issue: null, recommended: null },
  { id: '10477', number: 10477, customer: 'Olivia Davis', email: 'olivia@example.com', date: 'Sep 13', amount: 89.0, status: 'fulfilled', health: 'healthy', product: 'Brass Candle Holder', created: 'Sep 10, 2026', carrier: 'USPS', tracking: '9400111899223188', lastUpdate: '1 day ago', issue: null, recommended: null },
  { id: '10466', number: 10466, customer: 'William Lee', email: 'william@example.com', date: 'Sep 12', amount: 156.0, status: 'fulfilled', health: 'healthy', product: 'Glass Pendant Lamp', created: 'Sep 8, 2026', carrier: 'UPS', tracking: '1Z999AA10123456901', lastUpdate: '3 days ago', issue: null, recommended: null },
  { id: '10455', number: 10455, customer: 'Sophia Martin', email: 'sophia@example.com', date: 'Sep 12', amount: 38.0, status: 'fulfilled', health: 'healthy', product: 'Bamboo Bath Caddy', created: 'Sep 7, 2026', carrier: 'USPS', tracking: '9400111899223177', lastUpdate: '4 days ago', issue: null, recommended: null },
  { id: '10448', number: 10448, customer: 'Benjamin Clark', email: 'benjamin@example.com', date: 'Sep 11', amount: 94.0, status: 'delayed', health: 'critical', product: 'Marble Coaster Set', created: 'Sep 6, 2026', carrier: 'FedEx', tracking: '7489651188', lastUpdate: '6 days ago', issue: 'Shipment stalled at carrier facility.', recommended: 'Open a carrier inquiry and update the customer.' },
  { id: '10440', number: 10440, customer: 'Ava Thompson', email: 'ava@example.com', date: 'Sep 11', amount: 72.0, status: 'fulfilled', health: 'healthy', product: 'Linen Apron', created: 'Sep 5, 2026', carrier: 'USPS', tracking: '9400111899223166', lastUpdate: '5 days ago', issue: null, recommended: null },
  { id: '10435', number: 10435, customer: 'Noah Garcia', email: 'noah@example.com', date: 'Sep 10', amount: 118.0, status: 'unfulfilled', health: 'needs_attention', product: 'Walnut Serving Bowl', created: 'Sep 4, 2026', carrier: null, tracking: null, lastUpdate: '—', issue: 'Order unfulfilled for 6 days.', recommended: 'Prioritize fulfillment and confirm with customer.' },
  { id: '10429', number: 10429, customer: 'Mia Rodriguez', email: 'mia@example.com', date: 'Sep 10', amount: 56.0, status: 'fulfilled', health: 'healthy', product: 'Stoneware Mug Set', created: 'Sep 3, 2026', carrier: 'UPS', tracking: '1Z999AA10123456112', lastUpdate: '6 days ago', issue: null, recommended: null },
];

export const orderTimeline = [
  { id: 't1', label: 'Order placed', time: 'Sep 9, 2026 · 9:24 AM', done: true },
  { id: 't2', label: 'Payment confirmed', time: 'Sep 9, 2026 · 9:25 AM', done: true },
  { id: 't3', label: 'Fulfillment started', time: 'Sep 9, 2026 · 2:10 PM', done: true },
  { id: 't4', label: 'Tracking created', time: 'Sep 9, 2026 · 4:48 PM', done: true },
  { id: 't5', label: 'Last tracking update', time: 'Sep 9, 2026 · 6:02 PM', done: true, warning: true },
];

export const orderProducts = [
  { id: 'p1', name: 'Linen Throw Blanket', quantity: 1, price: 74.0, image: 'https://picsum.photos/seed/linen-throw/200/200' },
  { id: 'p2', name: 'Cotton Pillow Cover', quantity: 1, price: 10.0, image: 'https://picsum.photos/seed/cotton-pillow/200/200' },
];

export const adminStats = {
  totalUsers: { value: 127, sub: 'registered' },
  activeUsers: { value: 114, sub: 'active' },
  suspended: { value: 8, sub: 'suspended' },
  banned: { value: 5, sub: 'banned' },
  connectedStores: { value: 121, sub: 'Shopify connected' },
};

export const adminUsers = [
  { id: 'u1', name: 'Alex Morgan', email: 'alex@example.com', store: 'alex-store.myshopify.com', status: 'active', activated: 'Sep 1, 2026', lastActive: '2 min ago' },
  { id: 'u2', name: 'John Carter', email: 'john@example.com', store: 'john-store.myshopify.com', status: 'active', activated: 'Aug 22, 2026', lastActive: '1 hour ago' },
  { id: 'u3', name: 'Michael Reed', email: 'michael@example.com', store: 'michael-store.myshopify.com', status: 'suspended', activated: 'Aug 15, 2026', lastActive: '3 days ago' },
  { id: 'u4', name: 'Sarah Williams', email: 'sarah@example.com', store: 'sarah-store.myshopify.com', status: 'banned', activated: 'Jul 30, 2026', lastActive: '2 weeks ago' },
  { id: 'u5', name: 'Emma Wilson', email: 'emma@example.com', store: 'emma-store.myshopify.com', status: 'active', activated: 'Sep 5, 2026', lastActive: '5 min ago' },
  { id: 'u6', name: 'James Taylor', email: 'james@example.com', store: 'james-store.myshopify.com', status: 'active', activated: 'Sep 8, 2026', lastActive: 'Yesterday' },
  { id: 'u7', name: 'Olivia Davis', email: 'olivia@example.com', store: 'olivia-store.myshopify.com', status: 'active', activated: 'Aug 28, 2026', lastActive: '4 hours ago' },
  { id: 'u8', name: 'William Lee', email: 'william@example.com', store: 'william-store.myshopify.com', status: 'suspended', activated: 'Aug 19, 2026', lastActive: '1 week ago' },
];

export const adminUserDetail = {
  id: 'u1',
  name: 'Alex Morgan',
  email: 'alex@example.com',
  status: 'active',
  activated: 'September 1, 2026',
  lastLogin: '2 minutes ago',
  store: {
    url: 'alex-store.myshopify.com',
    status: 'connected',
    connectedDate: 'September 1, 2026',
  },
  license: {
    code: 'SHPME-7F3K-9Q2X-LM8T',
    status: 'active',
    createdDate: 'August 30, 2026',
  },
};

export const licenses = [
  { id: 'l1', code: 'SHPME-7F3K-9Q2X-LM8T', assignedUser: 'Alex Morgan', status: 'active', created: 'Aug 30, 2026', activated: 'Sep 1, 2026' },
  { id: 'l2', code: 'SHPME-2D4R-8M1N-PQ5S', assignedUser: 'John Carter', status: 'active', created: 'Aug 20, 2026', activated: 'Aug 22, 2026' },
  { id: 'l3', code: 'SHPME-9B6T-3K7L-WX2Y', assignedUser: '—', status: 'unused', created: 'Sep 10, 2026', activated: '—' },
  { id: 'l4', code: 'SHPME-1A2B-3C4D-5E6F', assignedUser: 'Michael Reed', status: 'suspended', created: 'Aug 14, 2026', activated: 'Aug 15, 2026' },
  { id: 'l5', code: 'SHPME-8G7H-6I5J-4K3L', assignedUser: 'Sarah Williams', status: 'revoked', created: 'Jul 28, 2026', activated: 'Jul 30, 2026' },
  { id: 'l6', code: 'SHPME-0Z9Y-8X7W-6V5U', assignedUser: '—', status: 'unused', created: 'Sep 12, 2026', activated: '—' },
];

export const adminStores = [
  { id: 's1', url: 'demo-store.myshopify.com', owner: 'Alex Morgan', status: 'connected', connected: 'Today', lastSync: '2 min ago', orders: 1284 },
  { id: 's2', url: 'john-store.myshopify.com', owner: 'John Carter', status: 'connected', connected: 'Aug 22', lastSync: '1 hour ago', orders: 642 },
  { id: 's3', url: 'emma-store.myshopify.com', owner: 'Emma Wilson', status: 'connected', connected: 'Sep 5', lastSync: '5 min ago', orders: 2103 },
  { id: 's4', url: 'james-store.myshopify.com', owner: 'James Taylor', status: 'syncing', connected: 'Sep 8', lastSync: 'just now', orders: 318 },
  { id: 's5', url: 'olivia-store.myshopify.com', owner: 'Olivia Davis', status: 'connected', connected: 'Aug 28', lastSync: '4 hours ago', orders: 877 },
  { id: 's6', url: 'michael-store.myshopify.com', owner: 'Michael Reed', status: 'disconnected', connected: 'Aug 15', lastSync: '3 days ago', orders: 154 },
];

export const adminActivity = [
  { id: 'ac1', user: 'Alex Morgan', action: 'User activated account', time: 'Sep 14, 2026 · 5:28 PM', device: 'Chrome · macOS', status: 'success' },
  { id: 'ac2', user: 'Emma Wilson', action: 'Shopify store connected', time: 'Sep 14, 2026 · 4:12 PM', device: 'Safari · iOS', status: 'success' },
  { id: 'ac3', user: 'John Carter', action: 'User logged in', time: 'Sep 14, 2026 · 3:55 PM', device: 'Chrome · Windows', status: 'success' },
  { id: 'ac4', user: 'Admin', action: 'License created (5 codes)', time: 'Sep 14, 2026 · 2:30 PM', device: 'Chrome · macOS', status: 'success' },
  { id: 'ac5', user: 'Admin', action: 'User suspended', time: 'Sep 14, 2026 · 1:14 PM', device: 'Chrome · macOS', status: 'warning' },
  { id: 'ac6', user: 'Admin', action: 'User reactivated', time: 'Sep 14, 2026 · 12:02 PM', device: 'Chrome · macOS', status: 'success' },
  { id: 'ac7', user: 'Michael Reed', action: 'Shopify disconnected', time: 'Sep 13, 2026 · 9:48 PM', device: 'Firefox · Windows', status: 'destructive' },
  { id: 'ac8', user: 'James Taylor', action: 'Shopify store connected', time: 'Sep 13, 2026 · 6:20 PM', device: 'Chrome · Android', status: 'success' },
];

export const revenueSeries = [
  { day: 'Mon', value: 6200 },
  { day: 'Tue', value: 7400 },
  { day: 'Wed', value: 6900 },
  { day: 'Thu', value: 8800 },
  { day: 'Fri', value: 9600 },
  { day: 'Sat', value: 11200 },
  { day: 'Sun', value: 8100 },
];