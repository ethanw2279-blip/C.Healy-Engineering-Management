-- ============================================================================
-- Client portal — Stage 3 backends. Run after 0009_client_portal.sql and
-- 0016_ga1_portal.sql.
--   • Multi-user accounts + invites (many logins → one client).
--   • Notification preferences (per client).
--   • Documents: tighten attachment reads to staff-or-own-client.
--   • Parts & orders: let a client browse products and read their own orders.
--
-- The attachments / shop sections are guarded with IF EXISTS so this migration
-- runs cleanly even if those base tables (0004_attachments / 0011_shop) haven't
-- been applied in this project — the related portal features simply stay dark.
-- ============================================================================

-- ── Multi-user accounts ─────────────────────────────────────────────────────
create table if not exists client_users (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references clients (id) on delete cascade,
  email         text not null,
  auth_user_id  uuid references auth.users (id) on delete set null,
  role          text not null default 'member' check (role in ('owner','member','viewer')),
  invited_by    uuid,
  created_at    timestamptz not null default now()
);
create unique index if not exists client_users_client_email_idx on client_users (client_id, lower(email));
create index if not exists client_users_auth_idx on client_users (auth_user_id);

create or replace function public.current_client_id()
returns uuid language sql stable security definer set search_path = public as $$
  select coalesce(
    (select id from clients where auth_user_id = auth.uid() limit 1),
    (select client_id from client_users where auth_user_id = auth.uid() limit 1)
  );
$$;

create or replace function public.link_client_account()
returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid; uemail text;
begin
  select current_client_id() into cid;
  if cid is not null then return cid; end if;
  select email into uemail from auth.users where id = auth.uid();
  if uemail is null then return null; end if;
  update client_users set auth_user_id = auth.uid()
   where lower(email) = lower(uemail) and auth_user_id is null returning client_id into cid;
  if cid is not null then return cid; end if;
  update clients set auth_user_id = auth.uid()
   where lower(email) = lower(uemail) and auth_user_id is null returning id into cid;
  return cid;
end;
$$;

grant execute on function public.current_client_id()  to authenticated;
grant execute on function public.link_client_account() to authenticated;

alter table client_users enable row level security;
drop policy if exists "client reads own members" on client_users;
drop policy if exists "client manages own members" on client_users;
drop policy if exists "staff reads members" on client_users;
create policy "client reads own members" on client_users for select to authenticated
  using (client_id = current_client_id());
create policy "client manages own members" on client_users for all to authenticated
  using (client_id = current_client_id())
  with check (client_id = current_client_id());
create policy "staff reads members" on client_users for all to authenticated
  using (exists (select 1 from employees where auth_user_id = auth.uid()))
  with check (exists (select 1 from employees where auth_user_id = auth.uid()));

-- ── Notification preferences ────────────────────────────────────────────────
create table if not exists client_notification_prefs (
  client_id         uuid primary key references clients (id) on delete cascade,
  ga1_reminders     boolean not null default true,
  invoice_reminders boolean not null default true,
  quote_updates     boolean not null default true,
  job_updates       boolean not null default true,
  marketing         boolean not null default false,
  notify_email      text,
  updated_at        timestamptz not null default now()
);
alter table client_notification_prefs enable row level security;
drop policy if exists "client rw own notif prefs" on client_notification_prefs;
drop policy if exists "staff reads notif prefs" on client_notification_prefs;
create policy "client rw own notif prefs" on client_notification_prefs for all to authenticated
  using (client_id = current_client_id())
  with check (client_id = current_client_id());
create policy "staff reads notif prefs" on client_notification_prefs for select to authenticated
  using (exists (select 1 from employees where auth_user_id = auth.uid()));

-- ── Documents: tighten attachment reads (only if the table exists) ──────────
do $$
begin
  if to_regclass('public.attachments') is not null then
    drop policy if exists "read attachments" on attachments;
    create policy "read attachments" on attachments for select to authenticated
      using (
        exists (select 1 from employees where auth_user_id = auth.uid())
        or (entity_type = 'client' and entity_id = current_client_id())
        or (entity_type = 'job' and entity_id in (select id from jobs where client_id = current_client_id()))
      );
  end if;
end $$;

-- ── Parts & orders: client access (only if the shop tables exist) ───────────
do $$
begin
  if to_regclass('public.products') is not null then
    drop policy if exists "client reads active products" on products;
    create policy "client reads active products" on products for select to authenticated
      using (active);
  end if;
  if to_regclass('public.orders') is not null then
    drop policy if exists "client reads own orders" on orders;
    create policy "client reads own orders" on orders for select to authenticated
      using (client_id = current_client_id());
  end if;
  if to_regclass('public.order_items') is not null then
    drop policy if exists "client reads own order_items" on order_items;
    create policy "client reads own order_items" on order_items for select to authenticated
      using (order_id in (select id from orders where client_id = current_client_id()));
  end if;
end $$;
