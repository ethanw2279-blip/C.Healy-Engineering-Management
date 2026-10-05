-- ============================================================================
-- Record when a photo was taken (read from the image's EXIF data), separate
-- from when it was uploaded (created_at). Run after 0004_attachments.sql.
-- ============================================================================

alter table if exists attachments add column if not exists taken_at timestamptz;
