-- ============================================================================
-- Notes on clients and jobs. Run in the Supabase SQL editor after 0001_init.sql.
-- ============================================================================

create table notes (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('client','job')),
  entity_id   uuid not null,
  body        text not null,
  author_id   uuid references employees (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index notes_entity_idx on notes (entity_type, entity_id);

alter table notes enable row level security;

-- Any signed-in team member can read and add notes; editing/removing needs the
-- create:records permission.
create policy "read notes"   on notes for select to authenticated using (true);
create policy "add notes"    on notes for insert to authenticated with check (true);
create policy "manage notes" on notes for delete to authenticated using (has_perm('create:records'));
create policy "update notes" on notes for update to authenticated using (has_perm('create:records')) with check (has_perm('create:records'));
