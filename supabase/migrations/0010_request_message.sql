-- ============================================================================
-- Store the free-text message from a website contact form on the request.
-- Run after 0001_init.sql.
-- ============================================================================

alter table requests add column if not exists message text;
