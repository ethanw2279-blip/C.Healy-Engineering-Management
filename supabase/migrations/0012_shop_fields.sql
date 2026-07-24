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

-- Slugs are the website's product URLs — keep them unique. A plain unique index
-- (not partial) still allows many NULL slugs and, unlike a partial index, works
-- as an ON CONFLICT (slug) target for the product import.
drop index if exists products_slug_key;
create unique index if not exists products_slug_key on products (slug);
