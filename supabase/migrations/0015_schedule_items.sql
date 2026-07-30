-- ============================================================================
-- Let the schedule hold non-job items (travel, shop trips, etc.) and let field
-- crew add their own. Run after 0001_init.sql (and 0005_field_access.sql).
-- ============================================================================

-- A visit no longer has to belong to a job.
alter table visits alter column job_id drop not null;
alter table visits add column if not exists title    text;
alter table visits add column if not exists category text;

-- Field crew can add / edit / remove their own schedule items.
drop policy if exists "manage own visits" on visits;
create policy "manage own visits" on visits for all to authenticated
  using (employee_id in (select id from employees where auth_user_id = auth.uid()))
  with check (employee_id in (select id from employees where auth_user_id = auth.uid()));
