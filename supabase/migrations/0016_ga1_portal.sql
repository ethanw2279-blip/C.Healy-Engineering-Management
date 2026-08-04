-- ============================================================================
-- Client portal: GA1 access. Run after 0009_client_portal.sql.
-- Lets a signed-in client read ONLY their own GA1 thorough-examination
-- reports, so the portal can show their register and link each cert.
-- The additive policy ORs with the existing staff (has_perm) policy, so staff
-- access is unchanged.
-- ============================================================================

drop policy if exists "client reads own ga1" on ga1_inspections;

create policy "client reads own ga1" on ga1_inspections for select to authenticated
  using (client_id = current_client_id());
