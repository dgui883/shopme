-- SHOPME database schema
-- Run this once in Supabase SQL editor (or via `supabase db push`).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.

create extension if not exists pgcrypto;

-- =========================================================
-- 1. profiles  (1:1 with auth.users)
-- =========================================================
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'customer' check (role in ('customer','admin')),
  status text not null default 'active' check (status in ('active','suspended','banned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function handle_new_auth_user()
returns trigger as $$
begin
  insert into profiles (auth_user_id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- =========================================================
-- 2. licenses
-- =========================================================
create table if not exists licenses (
  id uuid primary key default gen_random_uuid(),
  activation_code text not null unique,
  status text not null default 'unused' check (status in ('unused','active','suspended','revoked')),
  assigned_user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz
);

-- =========================================================
-- 3. shopify_stores
-- =========================================================
create table if not exists shopify_stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  shop_domain text not null unique,
  shop_name text,
  shopify_store_id text,
  connection_status text not null default 'connected' check (connection_status in ('connected','disconnected')),
  scopes text,
  connected_at timestamptz not null default now(),
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- 4. shopify_connections (encrypted token storage)
-- =========================================================
create table if not exists shopify_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  shopify_store_id uuid not null unique references shopify_stores(id) on delete cascade,
  shop_domain text not null,
  encrypted_access_token text not null, -- AES-256-GCM ciphertext, base64: iv:tag:ciphertext
  scopes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- =========================================================
-- 5. orders
-- =========================================================
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  shopify_order_id text not null,
  shopify_store_id uuid not null references shopify_stores(id) on delete cascade,
  order_number text,
  customer_name text,
  customer_email text,
  currency text,
  total_price numeric,
  financial_status text,
  fulfillment_status text,
  order_status text,
  health_status text not null default 'healthy' check (health_status in ('healthy','needs_attention','critical')),
  health_reason text,
  shipping_address jsonb,
  tracking_number text,
  tracking_url text,
  carrier text,
  tracking_status text,
  last_tracking_update timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fulfilled_at timestamptz,
  unique (shopify_store_id, shopify_order_id)
);

create index if not exists idx_orders_store on orders(shopify_store_id);
create index if not exists idx_orders_health on orders(health_status);

-- =========================================================
-- 6. order_items
-- =========================================================
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  shopify_product_id text,
  shopify_variant_id text,
  product_title text,
  quantity integer,
  price numeric,
  image_url text
);

-- =========================================================
-- 7. customers (Shopify customers, not SHOPME users)
-- =========================================================
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  shopify_customer_id text,
  shopify_store_id uuid not null references shopify_stores(id) on delete cascade,
  name text,
  email text,
  phone text,
  orders_count integer default 0,
  total_spent numeric default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shopify_store_id, shopify_customer_id)
);

-- =========================================================
-- 8. activities
-- =========================================================
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  shopify_store_id uuid references shopify_stores(id) on delete set null,
  activity_type text not null,
  description text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_activities_user on activities(user_id);

-- =========================================================
-- 9. notifications
-- =========================================================
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text,
  title text,
  message text,
  severity text default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 10. webhook_events (idempotency ledger)
-- =========================================================
create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  shopify_webhook_id text not null unique,
  topic text not null,
  shop_domain text not null,
  received_at timestamptz not null default now()
);

-- =========================================================
-- 11. oauth_states (short-lived CSRF/nonce tracking as a belt-and-braces
--     backup to the signed-JWT state param used by the OAuth function)
-- =========================================================
create table if not exists oauth_states (
  state text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  shop_domain text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table profiles enable row level security;
alter table licenses enable row level security;
alter table shopify_stores enable row level security;
alter table shopify_connections enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table customers enable row level security;
alter table activities enable row level security;
alter table notifications enable row level security;
alter table webhook_events enable row level security;
alter table oauth_states enable row level security;

-- Helper: current user's profile id
create or replace function auth_profile_id()
returns uuid as $$
  select id from profiles where auth_user_id = auth.uid();
$$ language sql stable security definer;

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where auth_user_id = auth.uid() and role = 'admin' and status = 'active'
  );
$$ language sql stable security definer;

-- ---- profiles ----
drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own on profiles
  for select using (auth_user_id = auth.uid() or is_admin());

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles
  for update using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid() and role = 'customer'); -- users can't self-promote to admin

-- No insert/delete policy for regular users: profile rows are created only
-- by the auth trigger (security definer) or by admin actions via the
-- service-role key in Netlify Functions, which bypasses RLS entirely.

-- ---- licenses ----
-- Customers may only see the license assigned to them. All creation,
-- revocation, and lookup-by-code-during-activation happens via the
-- service-role key in Netlify Functions (never directly from the browser),
-- so no insert/update policy is granted to regular users.
drop policy if exists licenses_select_own on licenses;
create policy licenses_select_own on licenses
  for select using (assigned_user_id = auth_profile_id() or is_admin());

-- ---- shopify_stores ----
drop policy if exists stores_select_own on shopify_stores;
create policy stores_select_own on shopify_stores
  for select using (user_id = auth_profile_id() or is_admin());

-- Inserts/updates to shopify_stores happen only via Netlify Functions
-- (service role) during the OAuth callback and disconnect flow.

-- ---- shopify_connections ----
-- No policy grants SELECT to regular users at all. This table holds
-- encrypted tokens and must only ever be reachable via the service role.
-- (RLS with no matching policy = default deny for anon/authenticated.)

-- ---- orders ----
drop policy if exists orders_select_own on orders;
create policy orders_select_own on orders
  for select using (
    shopify_store_id in (select id from shopify_stores where user_id = auth_profile_id())
    or is_admin()
  );

-- ---- order_items ----
drop policy if exists order_items_select_own on order_items;
create policy order_items_select_own on order_items
  for select using (
    order_id in (
      select o.id from orders o
      join shopify_stores s on s.id = o.shopify_store_id
      where s.user_id = auth_profile_id()
    )
    or is_admin()
  );

-- ---- customers ----
drop policy if exists customers_select_own on customers;
create policy customers_select_own on customers
  for select using (
    shopify_store_id in (select id from shopify_stores where user_id = auth_profile_id())
    or is_admin()
  );

-- ---- activities ----
drop policy if exists activities_select_own on activities;
create policy activities_select_own on activities
  for select using (user_id = auth_profile_id() or is_admin());

-- ---- notifications ----
drop policy if exists notifications_select_own on notifications;
create policy notifications_select_own on notifications
  for select using (user_id = auth_profile_id());

drop policy if exists notifications_update_own on notifications;
create policy notifications_update_own on notifications
  for update using (user_id = auth_profile_id())
  with check (user_id = auth_profile_id());

-- ---- webhook_events / oauth_states ----
-- No policies granted: service-role only, never read from the browser.

-- =========================================================
-- Seed: first admin (optional). Replace the email, run manually AFTER
-- that user has registered once via normal signup.
-- =========================================================
-- update profiles set role = 'admin' where email = 'you@example.com';
