-- ============================================================================
-- Shop: products (with stock), orders, and order line items.
-- Run in the Supabase SQL editor after 0001_init.sql.
-- ============================================================================

create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  sku         text,
  description text,
  price       numeric not null default 0,
  stock       integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists orders (
  id          uuid primary key default gen_random_uuid(),
  number      text not null,
  client_id   uuid not null references clients (id) on delete cascade,
  status      text not null default 'New' check (status in ('New','Processing','Fulfilled','Cancelled')),
  source      text not null default 'admin' check (source in ('admin','website')),
  note        text,
  invoice_id  uuid references invoices (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  name       text not null,
  qty        numeric not null default 1,
  unit_price numeric not null default 0
);

create index if not exists order_items_order_idx on order_items (order_id);
create index if not exists orders_client_idx on orders (client_id);

alter table products    enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;

-- Staff with shop access (or the broad create:records permission) can read;
-- creating/editing needs create:records. The website endpoints use the
-- service-role key and bypass RLS entirely.
drop policy if exists "read products"  on products;
drop policy if exists "write products" on products;
create policy "read products"  on products for select to authenticated using (has_perm('view:shop') or has_perm('create:records'));
create policy "write products" on products for all    to authenticated using (has_perm('create:records')) with check (has_perm('create:records'));

drop policy if exists "read orders"  on orders;
drop policy if exists "write orders" on orders;
create policy "read orders"  on orders for select to authenticated using (has_perm('view:shop') or has_perm('create:records'));
create policy "write orders" on orders for all    to authenticated using (has_perm('create:records')) with check (has_perm('create:records'));

drop policy if exists "read order_items"  on order_items;
drop policy if exists "write order_items" on order_items;
create policy "read order_items"  on order_items for select to authenticated using (has_perm('view:shop') or has_perm('create:records'));
create policy "write order_items" on order_items for all    to authenticated using (has_perm('create:records')) with check (has_perm('create:records'));
