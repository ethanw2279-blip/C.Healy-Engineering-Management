-- ============================================================================
-- Richer shop-catalogue fields on products, so the app is the single source of
-- truth for the website shop. Run after 0011_shop.sql.
-- ============================================================================

alter table products add column if not exists slug        text;
alter table products add column if not exists category    text;
alter table products add column if not exists subcategory text;
alter table products add column if not exists short       text;
alter table products add column if not exists tag         text;
alter table products add column if not exists images      jsonb not null default '[]'::jsonb;
alter table products add column if not exists specs       jsonb not null default '[]'::jsonb;

-- Slugs are the website's product URLs — keep them unique when set.
create unique index if not exists products_slug_key on products (slug) where slug is not null;
