-- ============================================================================
-- File attachments on clients and jobs. Run after 0001_init.sql.
-- Files live in a private Storage bucket; this table holds their metadata.
-- ============================================================================

create table attachments (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('client','job')),
  entity_id   uuid not null,
  file_name   text not null,
  path        text not null, -- object path within the 'attachments' bucket
  size        bigint not null default 0,
  uploaded_by uuid references employees (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index attachments_entity_idx on attachments (entity_type, entity_id);

alter table attachments enable row level security;

create policy "read attachments"   on attachments for select to authenticated using (true);
create policy "add attachments"    on attachments for insert to authenticated with check (true);
create policy "delete attachments" on attachments for delete to authenticated using (has_perm('create:records') or uploaded_by in (select id from employees where auth_user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Private Storage bucket + access policies for signed-in staff.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "attach objects read"   on storage.objects for select to authenticated using (bucket_id = 'attachments');
create policy "attach objects insert" on storage.objects for insert to authenticated with check (bucket_id = 'attachments');
create policy "attach objects delete" on storage.objects for delete to authenticated using (bucket_id = 'attachments');
