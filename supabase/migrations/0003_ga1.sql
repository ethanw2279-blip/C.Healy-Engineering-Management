-- ============================================================================
-- GA1 lifting-equipment inspection reports. Run after 0001_init.sql.
-- The examiner (competent person) is one of your existing employees.
-- ============================================================================

create table ga1_inspections (
  id                        uuid primary key default gen_random_uuid(),
  report_number             text unique,
  client_id                 uuid references clients (id) on delete set null,
  examiner_id               uuid references employees (id) on delete set null,
  examiner_cert             text default '',
  equipment_type            text default '',
  manufacturer              text default '',
  model                     text default '',
  serial_number             text default '',
  swl                       text default '',
  year_of_manufacture       text default '',
  equipment_description     text default '',
  examination_date          date,
  previous_examination_date date,
  next_examination_date     date,
  examination_location      text default '',
  safe_to_use               boolean not null default false,
  defects_found             boolean not null default false,
  overall_result            text not null default 'safe' check (overall_result in ('safe','repair_required','unsafe')),
  defects_description       text default '',
  reinspection_date         date,
  additional_notes          text default '',
  signature                 text default '',
  purpose_of_examination    text default '12 Monthly Testing',
  particulars_of_tests      text default '',
  created_at                timestamptz not null default now()
);

create index ga1_client_idx on ga1_inspections (client_id);

alter table ga1_inspections enable row level security;

create policy "read ga1"  on ga1_inspections for select to authenticated using (has_perm('view:ga1'));
create policy "write ga1" on ga1_inspections for all    to authenticated using (has_perm('create:records')) with check (has_perm('create:records'));
