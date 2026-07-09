-- ============================================================================
-- Client portal. Run after 0001_init.sql.
-- Lets a client log in and see ONLY their own quotes, jobs, and invoices, and
-- approve a quote. Clients link to a Supabase auth user by matching email.
-- ============================================================================

-- Link a client record to a login (mirrors employees.auth_user_id).
alter table clients add column if not exists auth_user_id uuid unique references auth.users (id) on delete set null;

-- The client id for the signed-in user (null for staff / unlinked users).
create or replace function public.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from clients where auth_user_id = auth.uid() limit 1;
$$;

-- Called by the portal right after login: link the client whose email matches
-- the signed-in user, if not already linked. Returns the linked client id.
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
  select id into cid from clients where auth_user_id = auth.uid() limit 1;
  if cid is not null then return cid; end if;

  select email into uemail from auth.users where id = auth.uid();
  if uemail is null then return null; end if;

  update clients set auth_user_id = auth.uid()
   where lower(email) = lower(uemail) and auth_user_id is null
   returning id into cid;
  return cid;
end;
$$;

-- Approve one of the caller's own quotes. Security-definer so the client can
-- change nothing else — only flip an awaiting quote to approved.
create or replace function public.approve_quote(q_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update quotes set status = 'Approved'
   where id = q_id
     and client_id = current_client_id()
     and status = 'Awaiting response';
end;
$$;

grant execute on function public.current_client_id()  to authenticated;
grant execute on function public.link_client_account() to authenticated;
grant execute on function public.approve_quote(uuid)   to authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security: additive read policies for the signed-in client.
-- These OR with the existing staff (has_perm) policies, so staff access is
-- unchanged and a client sees only their own, non-draft records.
-- ---------------------------------------------------------------------------
drop policy if exists "client reads own client"        on clients;
drop policy if exists "client reads own quotes"        on quotes;
drop policy if exists "client reads own quote_items"   on quote_items;
drop policy if exists "client reads own jobs"          on jobs;
drop policy if exists "client reads own invoices"      on invoices;
drop policy if exists "client reads own invoice_items" on invoice_items;

create policy "client reads own client" on clients for select to authenticated
  using (auth_user_id = auth.uid());

create policy "client reads own quotes" on quotes for select to authenticated
  using (client_id = current_client_id() and status <> 'Draft' and status <> 'Archived');

create policy "client reads own quote_items" on quote_items for select to authenticated
  using (quote_id in (select id from quotes where client_id = current_client_id()));

create policy "client reads own jobs" on jobs for select to authenticated
  using (client_id = current_client_id());

create policy "client reads own invoices" on invoices for select to authenticated
  using (client_id = current_client_id() and status <> 'Draft');

create policy "client reads own invoice_items" on invoice_items for select to authenticated
  using (invoice_id in (select id from invoices where client_id = current_client_id()));
