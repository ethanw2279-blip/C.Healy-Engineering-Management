-- ============================================================================
-- Allow attachments on GA1 inspections (in addition to clients and jobs).
-- Run after 0004_attachments.sql.
-- ============================================================================

alter table attachments drop constraint if exists attachments_entity_type_check;
alter table attachments add constraint attachments_entity_type_check
  check (entity_type in ('client', 'job', 'ga1'));
