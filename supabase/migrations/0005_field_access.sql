-- ============================================================================
-- Field-crew self-service access. Run after 0001_init.sql.
-- Lets employees log their own hours and update jobs they are assigned to,
-- without granting the admin-level approve:timesheets / create:records perms.
-- ============================================================================

-- A signed-in employee can insert a time entry for themselves (mobile clock).
create policy "log own time"
  on time_entries for insert to authenticated
  with check (
    employee_id in (select id from employees where auth_user_id = auth.uid())
  );

-- An assigned crew member can update the jobs they're on (e.g. mark complete).
create policy "assignee updates job"
  on jobs for update to authenticated
  using (
    exists (
      select 1 from job_assignees ja
      join employees e on e.id = ja.employee_id
      where ja.job_id = jobs.id and e.auth_user_id = auth.uid()
    )
  )
  with check (true);
