-- ============================================================================
-- Trip tracking. Travel time entries can now carry the trip itself:
-- start/finish time, distance in km, the reason, and where from / to.
-- All optional, so existing rows and working-hours entries are unchanged.
-- ============================================================================

alter table time_entries add column if not exists start_time text;
alter table time_entries add column if not exists end_time text;
alter table time_entries add column if not exists km numeric;
alter table time_entries add column if not exists trip_reason text;
alter table time_entries add column if not exists trip_from text;
alter table time_entries add column if not exists trip_to text;
