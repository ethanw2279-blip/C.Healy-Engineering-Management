-- ============================================================================
-- Each job can have its own site address and Eircode, for clients who work
-- in different places. Directions in the field app use these first and fall
-- back to the client's address. Run after 0001_init.sql.
-- ============================================================================

alter table if exists jobs add column if not exists site_address text;
alter table if exists jobs add column if not exists eircode text;
