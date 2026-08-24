-- ============================================================================
-- Travel time & travel pay.
--   * time_entries.kind  — distinguishes travel time from normal working hours
--   * employees.travel_rate — €/h paid for travel time (0 = travel unpaid)
-- Both default so existing rows keep their current behaviour (all work, no
-- travel pay) until rates are set.
-- ============================================================================

alter table time_entries
  add column if not exists kind text not null default 'work'
  check (kind in ('work', 'travel'));

alter table employees
  add column if not exists travel_rate numeric not null default 0;
