-- ============================================================================
-- Let field crew edit / delete their OWN time entries, as long as those entries
-- haven't been approved yet. Run after 0005_field_access.sql.
-- ============================================================================

-- Update own, still-unapproved entries (and it must stay theirs + unapproved).
drop policy if exists "edit own unapproved time" on time_entries;
create policy "edit own unapproved time"
  on time_entries for update to authenticated
  using (
    approved = false
    and employee_id in (select id from employees where auth_user_id = auth.uid())
  )
  with check (
    approved = false
    and employee_id in (select id from employees where auth_user_id = auth.uid())
  );

-- Delete own, still-unapproved entries.
drop policy if exists "delete own unapproved time" on time_entries;
create policy "delete own unapproved time"
  on time_entries for delete to authenticated
  using (
    approved = false
    and employee_id in (select id from employees where auth_user_id = auth.uid())
  );
