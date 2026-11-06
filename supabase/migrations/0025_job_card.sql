-- ============================================================================
-- Job card: the stages of a job (e.g. "Cut and prep stock", "Fully weld
-- frame") and how long each person spent on each one. Kept separate from
-- timesheets on purpose. The office can turn a job card into a quote or an
-- invoice. Stage lists can be saved as templates to reuse on similar jobs.
--
-- Only adds new tables, so it is safe to run on the live database.
-- Run after 0024_stock.sql.
-- ============================================================================

create table if not exists job_stages (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references jobs (id) on delete cascade,
  name       text not null,
  sort       integer not null default 0,
  done       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists job_stages_job_idx on job_stages (job_id, sort);

-- One row per stretch of time someone spent on a stage. A running timer is a
-- row with started_at set; stopping it fills in hours and clears started_at.
create table if not exists job_stage_entries (
  id          uuid primary key default gen_random_uuid(),
  stage_id    uuid not null references job_stages (id) on delete cascade,
  job_id      uuid not null references jobs (id) on delete cascade,
  employee_id uuid references employees (id) on delete set null,
  date        date not null default current_date,
  hours       numeric not null default 0,
  note        text,
  started_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists job_stage_entries_job_idx on job_stage_entries (job_id);

create table if not exists job_stage_templates (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  stages     text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ── Access ─────────────────────────────────────────────────────────────────
-- Anyone who can see jobs can see and fill in the job card. Templates are
-- saved by office staff (Create records).
alter table job_stages          enable row level security;
alter table job_stage_entries   enable row level security;
alter table job_stage_templates enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['job_stages', 'job_stage_entries'] loop
    execute format('drop policy if exists "read %1$s" on %1$s', t);
    execute format('drop policy if exists "write %1$s" on %1$s', t);
    execute format('create policy "read %1$s" on %1$s for select to authenticated using (has_perm(''view:jobs'') or has_perm(''create:records''))', t);
    execute format('create policy "write %1$s" on %1$s for all to authenticated using (has_perm(''view:jobs'') or has_perm(''create:records'')) with check (has_perm(''view:jobs'') or has_perm(''create:records''))', t);
  end loop;
end $$;

drop policy if exists "read job_stage_templates"  on job_stage_templates;
drop policy if exists "write job_stage_templates" on job_stage_templates;
create policy "read job_stage_templates" on job_stage_templates for select to authenticated
  using (has_perm('view:jobs') or has_perm('create:records'));
create policy "write job_stage_templates" on job_stage_templates for all to authenticated
  using (has_perm('create:records')) with check (has_perm('create:records'));
