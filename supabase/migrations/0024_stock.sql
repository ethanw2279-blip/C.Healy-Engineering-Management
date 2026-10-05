-- ============================================================================
-- Stock in the van and shed, materials on jobs, and the shopping list.
-- Run after 0021_notification_prefs_push.sql (it does not depend on 0022 or 0023).
--
-- Counts only change through stock_movements: each movement row adds its
-- delta to the matching stock_levels row (via a trigger), so the count and its
-- history always agree and changes queued offline replay safely.
--
-- The shopping list is mostly worked out by the app: stock at or below its
-- minimum, plus job materials marked "to buy". shopping_items only holds the
-- things people add by hand.
--
-- Alerts: "running low" / "out of stock" when a count crosses its minimum,
-- and "materials to buy" when a job material is marked to buy.
-- ============================================================================

create table if not exists stock_locations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  kind       text not null default 'van' check (kind in ('shed', 'van')),
  sort       integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists stock_items (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  unit       text not null default 'each',
  category   text,
  supplier   text,
  cost       numeric,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- One row per item per location. min_qty = alert at or below this (0 = no
-- alerts); top_up = how many to bring it back up to when buying.
create table if not exists stock_levels (
  item_id     uuid not null references stock_items (id) on delete cascade,
  location_id uuid not null references stock_locations (id) on delete cascade,
  count       numeric not null default 0,
  min_qty     numeric not null default 0,
  top_up      numeric not null default 0,
  primary key (item_id, location_id)
);

create table if not exists stock_movements (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references stock_items (id) on delete cascade,
  location_id uuid not null references stock_locations (id) on delete cascade,
  delta       numeric not null,
  reason      text not null default 'adjusted'
              check (reason in ('used', 'returned', 'bought', 'moved', 'counted', 'adjusted')),
  job_id      uuid references jobs (id) on delete set null,
  employee_id uuid references employees (id) on delete set null,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists stock_movements_item_idx on stock_movements (item_id, created_at desc);

create table if not exists job_materials (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references jobs (id) on delete cascade,
  item_id     uuid references stock_items (id) on delete set null,
  name        text not null,
  unit        text not null default 'each',
  qty         numeric not null default 1,
  status      text not null default 'to_buy' check (status in ('from_stock', 'to_buy', 'got', 'used')),
  location_id uuid references stock_locations (id) on delete set null,
  added_by    uuid references employees (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists job_materials_job_idx on job_materials (job_id);

create table if not exists shopping_items (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid references stock_items (id) on delete cascade,
  name       text not null,
  unit       text not null default 'each',
  qty        numeric not null default 1,
  added_by   uuid references employees (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ── Apply each movement to its level ───────────────────────────────────────
create or replace function public.stock_apply_movement()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into stock_levels (item_id, location_id, count)
  values (new.item_id, new.location_id, new.delta)
  on conflict (item_id, location_id) do update set count = stock_levels.count + excluded.count;
  return new;
end;
$$;

drop trigger if exists stock_apply_movement on stock_movements;
create trigger stock_apply_movement after insert on stock_movements
  for each row execute function public.stock_apply_movement();

-- ── Access ─────────────────────────────────────────────────────────────────
-- Anyone with Stock access (or office staff) can see stock, change counts,
-- add job materials and use the shopping list. Adding items and locations and
-- setting minimums needs Manage stock.
alter table stock_locations enable row level security;
alter table stock_items     enable row level security;
alter table stock_levels    enable row level security;
alter table stock_movements enable row level security;
alter table job_materials   enable row level security;
alter table shopping_items  enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['stock_locations', 'stock_items', 'stock_levels'] loop
    execute format('drop policy if exists "read %1$s" on %1$s', t);
    execute format('drop policy if exists "write %1$s" on %1$s', t);
    execute format('create policy "read %1$s" on %1$s for select to authenticated using (has_perm(''view:stock'') or has_perm(''create:records''))', t);
    execute format('create policy "write %1$s" on %1$s for all to authenticated using (has_perm(''manage:stock'')) with check (has_perm(''manage:stock''))', t);
  end loop;

  foreach t in array array['job_materials', 'shopping_items'] loop
    execute format('drop policy if exists "read %1$s" on %1$s', t);
    execute format('drop policy if exists "write %1$s" on %1$s', t);
    execute format('create policy "read %1$s" on %1$s for select to authenticated using (has_perm(''view:stock'') or has_perm(''create:records''))', t);
    execute format('create policy "write %1$s" on %1$s for all to authenticated using (has_perm(''view:stock'') or has_perm(''create:records'')) with check (has_perm(''view:stock'') or has_perm(''create:records''))', t);
  end loop;
end $$;

-- Movements are a history: they can be added, never edited.
drop policy if exists "read stock_movements"   on stock_movements;
drop policy if exists "insert stock_movements" on stock_movements;
create policy "read stock_movements" on stock_movements for select to authenticated
  using (has_perm('view:stock') or has_perm('create:records'));
create policy "insert stock_movements" on stock_movements for insert to authenticated
  with check (has_perm('view:stock') or has_perm('create:records'));

-- ── Give existing roles the new permissions ────────────────────────────────
-- Field crew (anyone who can see jobs) get Stock; office staff who can create
-- records also get Manage stock. Roles can be changed afterwards as usual.
update roles set permissions = array_append(permissions, 'view:stock')
 where not ('*' = any (permissions)) and 'view:jobs' = any (permissions)
   and not ('view:stock' = any (permissions));
update roles set permissions = array_append(permissions, 'manage:stock')
 where not ('*' = any (permissions)) and 'create:records' = any (permissions)
   and not ('manage:stock' = any (permissions));

-- ── Starting locations ─────────────────────────────────────────────────────
insert into stock_locations (name, kind, sort)
select v.name, v.kind, v.sort
  from (values ('Shed', 'shed', 0), ('Van', 'van', 1)) as v (name, kind, sort)
 where not exists (select 1 from stock_locations);

-- ── Alerts ─────────────────────────────────────────────────────────────────
-- A count crossing its minimum. Only the crossing alerts, so using more from
-- something already low stays quiet. Several items in a row coalesce.
create or replace function public.notif_stock_low()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  item record;
  loc  text;
begin
  if new.min_qty <= 0 or new.count > new.min_qty or old.count <= old.min_qty then
    return new;
  end if;
  select name, unit into item from stock_items where id = new.item_id;
  select name into loc from stock_locations where id = new.location_id;
  if new.count <= 0 then
    perform notify_staff(
      'view:stock', current_employee_id(), 'stock_out',
      '{n} item{s} out of stock in ' || coalesce(loc, 'stock'),
      coalesce(item.name, 'An item') || ' · on the shopping list',
      'stock', new.location_id, true);
  else
    perform notify_staff(
      'view:stock', current_employee_id(), 'stock_low',
      '{n} item{s} running low in ' || coalesce(loc, 'stock'),
      coalesce(item.name, 'An item') || ' · ' || trim_scale(new.count)::text || ' ' || coalesce(item.unit, '') || ' left',
      'stock', new.location_id, true);
  end if;
  return new;
exception when others then
  -- Alerts are best-effort (e.g. notifications not set up yet); never block a stock change.
  return new;
end;
$$;

drop trigger if exists notif_stock_low on stock_levels;
create trigger notif_stock_low after update of count on stock_levels
  for each row execute function public.notif_stock_low();

-- A job material marked "to buy" lets the office know it needs getting.
create or replace function public.notif_material_to_buy()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  j record;
begin
  if new.status <> 'to_buy' or (tg_op = 'UPDATE' and old.status = 'to_buy') then
    return new;
  end if;
  select number, title into j from jobs where id = new.job_id;
  perform notify_staff(
    'create:records', coalesce(current_employee_id(), new.added_by), 'materials_to_buy',
    '{n} item{s} to buy for ' || coalesce(j.number, 'a job'),
    new.name || ' · ' || trim_scale(new.qty)::text || ' ' || new.unit,
    'shopping', new.job_id, true);
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists notif_material_to_buy on job_materials;
create trigger notif_material_to_buy after insert or update of status on job_materials
  for each row execute function public.notif_material_to_buy();
