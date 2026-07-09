-- ============================================================================
-- Per-person GA1 access. Run after 0003_ga1.sql.
-- Adds a per-employee ga1_access flag and lets those employees use GA1 even
-- when their role doesn't include view:ga1.
-- ============================================================================

alter table employees add column if not exists ga1_access boolean not null default false;

-- True when the signed-in user has the per-person GA1 flag.
create or replace function public.has_ga1_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from employees e
    where e.auth_user_id = auth.uid() and e.ga1_access
  );
$$;

-- Rebuild the GA1 policies to allow role permission OR the per-person flag.
drop policy if exists "read ga1"  on ga1_inspections;
drop policy if exists "write ga1" on ga1_inspections;

create policy "read ga1"  on ga1_inspections for select to authenticated
  using (has_perm('view:ga1') or has_ga1_access());
create policy "write ga1" on ga1_inspections for all to authenticated
  using (has_perm('create:records') or has_ga1_access())
  with check (has_perm('create:records') or has_ga1_access());
