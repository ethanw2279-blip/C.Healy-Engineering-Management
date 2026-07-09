-- ============================================================================
-- Web Push subscriptions. Run after 0001_init.sql.
-- Stores each device's push subscription so the server can notify a crew
-- member (e.g. when they're assigned to a job).
-- ============================================================================

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_employee_idx on push_subscriptions (employee_id);

alter table push_subscriptions enable row level security;

-- A user can only manage push subscriptions tied to their own employee record.
-- (The server sends via the service-role key, which bypasses RLS.)
drop policy if exists "manage own push" on push_subscriptions;
create policy "manage own push" on push_subscriptions for all to authenticated
  using (employee_id in (select id from employees where auth_user_id = auth.uid()))
  with check (employee_id in (select id from employees where auth_user_id = auth.uid()));
