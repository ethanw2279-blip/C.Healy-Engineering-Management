-- ============================================================================
-- Client portal — Stage 3 backends. Run after 0009_client_portal.sql and
-- 0016_ga1_portal.sql.
--   • Documents: tighten attachment reads to staff-or-own-client.
--   • Notification preferences (per client).
--   • Multi-user accounts + invites (many logins → one client).
--   • Parts & orders: let a client browse products and read their own orders.
-- ============================================================================

-- ── Multi-user accounts ─────────────────────────────────────────────────────
-- A client may have several logins. The primary link stays on
-- clients.auth_user_id (0009); additional people are rows here.
create table if not exists client_users (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references clients (id) on delete cascade,
  email         text not null,
  auth_user_id  uuid references auth.users (id) on delete set null,
  role          text not null default 'member' check (role in ('owner','member','viewer')),
  invited_by    uuid,
  created_at    timestamptz not null default now(),
  unique (client_id, lower(email))
);
create index if not exists client_users_auth_idx on client_users (auth_user_id);

-- The client id for the signed-in user — now via the primary link OR a
-- client_users membership. Supersedes the 0009 definition.
create or replace function public.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select id from clients where auth_user_id = auth.uid() limit 1),
    (select client_id from client_users where auth_user_id = auth.uid() limit 1)
  );
$$;

-- Called by the portal right after login. Links the signed-in user to a client
-- by: (1) existing link, (2) a pending client_users invite matching their
-- email, (3) legacy — a client record whose email matches. Returns client id.
create or replace function public.link_client_account()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  uemail text;
begin
  -- (1) already linked (primary or membership)
  select current_client_id() into cid;
  if cid is not null then return cid; end if;

  select email into uemail from auth.users where id = auth.uid();
  if uemail is null then return null; end if;

  -- (2) claim a pending invite for this email
  update client_users set auth_user_id = auth.uid()
   where lower(email) = lower(uemail) and auth_user_id is null
   returning client_id into cid;
  if cid is not null then return cid; end if;

  -- (3) legacy primary link by matching client email
  update clients set auth_user_id = auth.uid()
   where lower(email) = lower(uemail) and auth_user_id is null
   returning id into cid;
  return cid;
end;
$$;

grant execute on function public.current_client_id()  to authenticated;
grant execute on function public.link_client_account() to authenticated;

alter table client_users enable row level security;
drop policy if exists "client reads own members" on client_users;
drop policy if exists "client manages own members" on client_users;
drop policy if exists "staff reads members" on client_users;
-- A member can see the people on their own account.
create policy "client reads own members" on client_users for select to authenticated
  using (client_id = current_client_id());
-- A member can invite/remove people on their own account.
create policy "client manages own members" on client_users for all to authenticated
  using (client_id = current_client_id())
  with check (client_id = current_client_id());
-- Staff can see/manage all.
create policy "staff reads members" on client_users for all to authenticated
  using (exists (select 1 from employees where auth_user_id = auth.uid()))
  with check (exists (select 1 from employees where auth_user_id = auth.uid()));

-- ── Documents: tighten attachment reads ─────────────────────────────────────
-- Was `using (true)` (any authenticated user). Restrict to staff, or a client
-- reading attachments on their own client record / their own jobs.
drop policy if exists "read attachments" on attachments;
create policy "read attachments" on attachments for select to authenticated
  using (
    exists (select 1 from employees where auth_user_id = auth.uid())
    or (entity_type = 'client' and entity_id = current_client_id())
    or (entity_type = 'job' and entity_id in (select id from jobs where client_id = current_client_id()))
  );

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

-- ── Parts & orders: client access ───────────────────────────────────────────
-- Clients may browse active products and read their own order history. Orders
-- are still created server-side (service role) via /api/portal/order.
drop policy if exists "client reads active products" on products;
create policy "client reads active products" on products for select to authenticated
  using (active);

drop policy if exists "client reads own orders" on orders;
create policy "client reads own orders" on orders for select to authenticated
  using (client_id = current_client_id());

drop policy if exists "client reads own order_items" on order_items;
create policy "client reads own order_items" on order_items for select to authenticated
  using (order_id in (select id from orders where client_id = current_client_id()));
