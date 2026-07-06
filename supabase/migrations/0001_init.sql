-- ============================================================================
-- Jobber clone — initial schema, row-level security, and auth linkage.
-- Run this in the Supabase SQL editor (or via the Supabase CLI).
-- ============================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Roles & employees
-- ---------------------------------------------------------------------------
create table roles (
  id          text primary key,
  name        text not null,
  description text not null default '',
  permissions text[] not null default '{}', -- permission keys, or {'*'} for all
  system      boolean not null default false
);

create table employees (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users (id) on delete set null,
  name          text not null,
  role_id       text not null references roles (id),
  email         text not null,
  phone         text not null default '',
  hourly_rate   numeric not null default 0,
  color         text not null default '#16343B',
  active        boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Clients, requests
-- ---------------------------------------------------------------------------
create table clients (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  company    text,
  email      text not null default '',
  phone      text not null default '',
  address    text not null default '',
  status     text not null default 'Lead' check (status in ('Lead','Active','Archived')),
  created_at date not null default current_date
);

create table requests (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients (id) on delete cascade,
  title        text not null,
  service      text not null default '',
  requested_on date not null default current_date,
  status       text not null default 'New' check (status in ('New','Assessment complete','Converted','Archived'))
);

-- ---------------------------------------------------------------------------
-- Quotes / jobs / invoices, each with child line-item tables
-- ---------------------------------------------------------------------------
create table quotes (
  id         uuid primary key default gen_random_uuid(),
  number     text not null,
  client_id  uuid not null references clients (id) on delete cascade,
  title      text not null,
  status     text not null default 'Draft' check (status in ('Draft','Awaiting response','Approved','Converted','Archived')),
  created_at date not null default current_date
);

create table jobs (
  id         uuid primary key default gen_random_uuid(),
  number     text not null,
  client_id  uuid not null references clients (id) on delete cascade,
  title      text not null,
  status     text not null default 'Unscheduled' check (status in ('Unscheduled','Scheduled','Active','Complete','Requires invoicing')),
  start_date date,
  end_date   date
);

create table invoices (
  id         uuid primary key default gen_random_uuid(),
  number     text not null,
  client_id  uuid not null references clients (id) on delete cascade,
  job_id     uuid references jobs (id) on delete set null,
  status     text not null default 'Draft' check (status in ('Draft','Awaiting payment','Paid','Past due')),
  issued_on  date not null default current_date,
  due_on     date not null default current_date
);

-- A line item belongs to exactly one parent. Three small tables keep the
-- foreign keys honest.
create table quote_items (
  id         uuid primary key default gen_random_uuid(),
  quote_id   uuid not null references quotes (id) on delete cascade,
  name       text not null,
  qty        numeric not null default 1,
  unit_price numeric not null default 0
);
create table job_items (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references jobs (id) on delete cascade,
  name       text not null,
  qty        numeric not null default 1,
  unit_price numeric not null default 0
);
create table invoice_items (
  id         uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  name       text not null,
  qty        numeric not null default 1,
  unit_price numeric not null default 0
);

-- Crew assigned to a job (many-to-many).
create table job_assignees (
  job_id      uuid not null references jobs (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  primary key (job_id, employee_id)
);

-- ---------------------------------------------------------------------------
-- Time entries & visits
-- ---------------------------------------------------------------------------
create table time_entries (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees (id) on delete cascade,
  job_id      uuid references jobs (id) on delete set null,
  date        date not null,
  hours       numeric not null default 0,
  note        text,
  approved    boolean not null default false
);

create table visits (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references jobs (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  date        date not null,
  start_time  text not null,
  end_time    text not null
);

-- ---------------------------------------------------------------------------
-- Permission helper — reads the signed-in user's role permissions.
-- Mirrors roleCan() in src/data/permissions.ts.
-- ---------------------------------------------------------------------------
create or replace function public.has_perm(key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from employees e
    join roles r on r.id = e.role_id
    where e.auth_user_id = auth.uid()
      and ('*' = any (r.permissions) or key = any (r.permissions))
  );
$$;

-- ---------------------------------------------------------------------------
-- Link a new auth user to a pre-seeded employee row by matching email, so the
-- first login inherits that employee's role.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update employees
     set auth_user_id = new.id
   where lower(email) = lower(new.email)
     and auth_user_id is null;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-level security. Every table is locked down; access flows through the
-- signed-in user's role permissions via has_perm().
-- ---------------------------------------------------------------------------
alter table roles          enable row level security;
alter table employees      enable row level security;
alter table clients        enable row level security;
alter table requests       enable row level security;
alter table quotes         enable row level security;
alter table quote_items    enable row level security;
alter table jobs           enable row level security;
alter table job_items      enable row level security;
alter table job_assignees  enable row level security;
alter table invoices       enable row level security;
alter table invoice_items  enable row level security;
alter table time_entries   enable row level security;
alter table visits         enable row level security;

-- Any signed-in user can read roles & employees (needed to render the app).
create policy "read roles"     on roles     for select to authenticated using (true);
create policy "read employees" on employees for select to authenticated using (true);
create policy "manage roles"     on roles     for all to authenticated using (has_perm('manage:roles')) with check (has_perm('manage:roles'));
create policy "manage employees" on employees for all to authenticated using (has_perm('manage:team'))  with check (has_perm('manage:team'));

-- Helper macro pattern: read requires a view perm, writes require create:records.
create policy "read clients"   on clients  for select to authenticated using (has_perm('view:clients'));
create policy "write clients"  on clients  for all    to authenticated using (has_perm('create:records')) with check (has_perm('create:records'));

create policy "read requests"  on requests for select to authenticated using (has_perm('view:requests'));
create policy "write requests" on requests for all    to authenticated using (has_perm('create:records')) with check (has_perm('create:records'));

create policy "read quotes"    on quotes   for select to authenticated using (has_perm('view:quotes'));
create policy "write quotes"   on quotes   for all    to authenticated using (has_perm('create:records')) with check (has_perm('create:records'));
create policy "read quote_items"  on quote_items  for select to authenticated using (has_perm('view:quotes'));
create policy "write quote_items" on quote_items for all    to authenticated using (has_perm('create:records')) with check (has_perm('create:records'));

create policy "read jobs"      on jobs     for select to authenticated using (has_perm('view:jobs'));
create policy "write jobs"     on jobs     for all    to authenticated using (has_perm('create:records')) with check (has_perm('create:records'));
create policy "read job_items"  on job_items  for select to authenticated using (has_perm('view:jobs'));
create policy "write job_items" on job_items for all    to authenticated using (has_perm('create:records')) with check (has_perm('create:records'));
create policy "read job_assignees"  on job_assignees  for select to authenticated using (has_perm('view:jobs'));
create policy "write job_assignees" on job_assignees for all    to authenticated using (has_perm('create:records')) with check (has_perm('create:records'));

create policy "read invoices"  on invoices for select to authenticated using (has_perm('view:invoices'));
create policy "write invoices" on invoices for all    to authenticated using (has_perm('create:records')) with check (has_perm('create:records'));
create policy "read invoice_items"  on invoice_items  for select to authenticated using (has_perm('view:invoices'));
create policy "write invoice_items" on invoice_items for all    to authenticated using (has_perm('create:records')) with check (has_perm('create:records'));

-- Timesheets: reading needs view:timesheets; approving/editing needs approve:timesheets.
create policy "read time_entries"    on time_entries for select to authenticated using (has_perm('view:timesheets'));
create policy "write time_entries"   on time_entries for all    to authenticated using (has_perm('approve:timesheets')) with check (has_perm('approve:timesheets'));

create policy "read visits"    on visits   for select to authenticated using (has_perm('view:schedule') or has_perm('view:jobs'));
create policy "write visits"   on visits   for all    to authenticated using (has_perm('create:records')) with check (has_perm('create:records'));
