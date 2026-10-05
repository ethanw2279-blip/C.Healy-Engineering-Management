-- ============================================================================
-- In-app notifications for the field and office apps. Run after
-- 0001_init.sql (and the later migrations it references: 0004 attachments,
-- 0011 shop, 0015 schedule items).
--
-- Each row is one notification for one employee. Rows are written only by the
-- security-definer triggers below, never directly by the apps, so a user can
-- read and mark-as-read their own notifications but can't create any.
--
-- Field crew are told about:   being assigned to a job, a new visit on their
--                              schedule, and their hours being approved.
-- Office staff are told about: photos/files uploaded to a job or GA1, new GA1
--                              reports, new requests, website/portal orders,
--                              quotes approved by a client, invoices paid, and
--                              jobs marked complete.
-- Nobody is notified about their own action.
-- ============================================================================

create table if not exists notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references employees (id) on delete cascade,
  actor_id     uuid references employees (id) on delete set null,
  kind         text not null,
  title        text not null,
  body         text not null default '',
  -- What the notification opens: job | ga1 | request | quote | invoice | order
  -- | timesheet | schedule. Each app turns this into its own route.
  entity_type  text,
  entity_id    uuid,
  -- Repeated events (e.g. 5 photos in a row) bump this instead of adding rows.
  count        integer not null default 1,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_recipient_idx on notifications (recipient_id, created_at desc);

alter table notifications enable row level security;

drop policy if exists "read own notifications"   on notifications;
drop policy if exists "update own notifications" on notifications;
drop policy if exists "delete own notifications" on notifications;
create policy "read own notifications" on notifications for select to authenticated
  using (recipient_id in (select id from employees where auth_user_id = auth.uid()));
create policy "update own notifications" on notifications for update to authenticated
  using (recipient_id in (select id from employees where auth_user_id = auth.uid()))
  with check (recipient_id in (select id from employees where auth_user_id = auth.uid()));
create policy "delete own notifications" on notifications for delete to authenticated
  using (recipient_id in (select id from employees where auth_user_id = auth.uid()));

-- Marking as read is the only edit a user can make.
revoke update on notifications from authenticated;
grant update (read_at) on notifications to authenticated;

-- Stream new/changed rows to the apps (RLS still limits each user to their own).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
     ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- The signed-in user's employee id (null for the website/service role).
create or replace function public.current_employee_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from employees where auth_user_id = auth.uid() limit 1;
$$;

-- Active, signed-up employees whose role grants the given permission.
create or replace function public.staff_with_perm(key text)
returns setof uuid language sql stable security definer set search_path = public as $$
  select e.id
    from employees e
    join roles r on r.id = e.role_id
   where e.active
     and e.auth_user_id is not null
     and ('*' = any (r.permissions) or key = any (r.permissions));
$$;

create or replace function public.employee_name(emp uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select name from employees where id = emp), 'Someone');
$$;

-- Write one notification. With coalesce = true, an unread notification of the
-- same kind, actor and record from the last 15 minutes is bumped instead, and
-- {n} / {s} / {ies} in the title and body are filled in from the new count.
create or replace function public.notify_employee(
  p_recipient   uuid,
  p_actor       uuid,
  p_kind        text,
  p_title       text,
  p_body        text,
  p_entity_type text,
  p_entity_id   uuid,
  p_coalesce    boolean default false
) returns void language plpgsql security definer set search_path = public as $$
declare
  existing uuid;
  n integer := 1;
begin
  if p_recipient is null or p_recipient is not distinct from p_actor then
    return;
  end if;

  if p_coalesce then
    select id, count + 1 into existing, n
      from notifications
     where recipient_id = p_recipient
       and kind = p_kind
       and read_at is null
       and actor_id is not distinct from p_actor
       and entity_id is not distinct from p_entity_id
       and created_at > now() - interval '15 minutes'
     order by created_at desc
     limit 1;
    if existing is null then n := 1; end if;
  end if;

  p_title := replace(replace(replace(p_title, '{n}', n::text), '{s}', case when n = 1 then '' else 's' end), '{ies}', case when n = 1 then 'y' else 'ies' end);
  p_body  := replace(replace(replace(p_body,  '{n}', n::text), '{s}', case when n = 1 then '' else 's' end), '{ies}', case when n = 1 then 'y' else 'ies' end);

  if existing is not null then
    update notifications
       set count = n, title = p_title, body = p_body, created_at = now()
     where id = existing;
  else
    insert into notifications (recipient_id, actor_id, kind, title, body, entity_type, entity_id)
    values (p_recipient, p_actor, p_kind, p_title, p_body, p_entity_type, p_entity_id);
  end if;
end;
$$;

-- Notify every holder of a permission (except the actor).
create or replace function public.notify_staff(
  p_perm        text,
  p_actor       uuid,
  p_kind        text,
  p_title       text,
  p_body        text,
  p_entity_type text,
  p_entity_id   uuid,
  p_coalesce    boolean default false
) returns void language plpgsql security definer set search_path = public as $$
declare
  rid uuid;
begin
  for rid in select staff_with_perm(p_perm) loop
    perform notify_employee(rid, p_actor, p_kind, p_title, p_body, p_entity_type, p_entity_id, p_coalesce);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Field crew notifications
-- ---------------------------------------------------------------------------

-- Assigned to a job. The office app re-saves a job's crew on every edit
-- (delete + re-insert), so only the first assignment to a job notifies.
create or replace function public.notif_job_assigned()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  j record;
begin
  if exists (
    select 1 from notifications
     where recipient_id = new.employee_id and kind = 'job_assigned' and entity_id = new.job_id
  ) then
    return new;
  end if;
  select number, title into j from jobs where id = new.job_id;
  perform notify_employee(
    new.employee_id, current_employee_id(), 'job_assigned',
    'You''ve been assigned to ' || coalesce(j.number, 'a job'),
    coalesce(j.title, ''),
    'job', new.job_id);
  return new;
end;
$$;

drop trigger if exists notif_job_assigned on job_assignees;
create trigger notif_job_assigned after insert on job_assignees
  for each row execute function public.notif_job_assigned();

-- A visit added to someone's schedule by someone else.
create or replace function public.notif_visit_added()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  label text;
begin
  select number || ' · ' || title into label from jobs where id = new.job_id;
  label := coalesce(nullif(new.title, ''), label, 'Visit');
  perform notify_employee(
    new.employee_id, current_employee_id(), 'visit_added',
    'New visit on ' || to_char(new.date, 'Dy DD Mon') || ' at ' || new.start_time,
    label,
    case when new.job_id is not null then 'job' else 'schedule' end,
    coalesce(new.job_id, new.id));
  return new;
end;
$$;

drop trigger if exists notif_visit_added on visits;
create trigger notif_visit_added after insert on visits
  for each row execute function public.notif_visit_added();

-- Hours approved. "Approve all" approves many rows at once, so these coalesce.
create or replace function public.notif_time_approved()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.approved and not old.approved then
    perform notify_employee(
      new.employee_id, current_employee_id(), 'time_approved',
      '{n} time entr{ies} approved',
      'Approved by ' || employee_name(current_employee_id()),
      'timesheet', null, true);
  end if;
  return new;
end;
$$;

drop trigger if exists notif_time_approved on time_entries;
create trigger notif_time_approved after update of approved on time_entries
  for each row execute function public.notif_time_approved();

-- ---------------------------------------------------------------------------
-- Office notifications
-- ---------------------------------------------------------------------------

-- Photos / files uploaded to a job or GA1. A batch upload coalesces into one.
do $$
begin
  if to_regclass('public.attachments') is null then return; end if;

  create or replace function public.notif_attachment_added()
  returns trigger language plpgsql security definer set search_path = public as $f$
  declare
    actor uuid := coalesce(current_employee_id(), new.uploaded_by);
    what  text := case when new.file_name ~* '\.(jpe?g|png|gif|webp|heic|heif)$' then 'photo' else 'file' end;
    label text;
  begin
    if new.entity_type = 'job' then
      select number || ' · ' || title into label from jobs where id = new.entity_id;
    elsif new.entity_type = 'ga1' then
      select coalesce(report_number, 'GA1 report') into label from ga1_inspections where id = new.entity_id;
    else
      return new;
    end if;
    perform notify_staff(
      'create:records', actor, what || '_added',
      employee_name(actor) || ' added {n} ' || what || '{s}',
      coalesce(label, ''),
      new.entity_type, new.entity_id, true);
    return new;
  end;
  $f$;

  drop trigger if exists notif_attachment_added on attachments;
  create trigger notif_attachment_added after insert on attachments
    for each row execute function public.notif_attachment_added();
end $$;

-- New GA1 report (flagged louder when equipment isn't safe to use).
create or replace function public.notif_ga1_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  actor  uuid := coalesce(current_employee_id(), new.examiner_id);
  client text;
begin
  select name into client from clients where id = new.client_id;
  perform notify_staff(
    'create:records', actor, 'ga1_created',
    case new.overall_result
      when 'unsafe'          then concat_ws(' ', coalesce(new.report_number, 'GA1 report'), 'failed: unsafe')
      when 'repair_required' then concat_ws(' ', coalesce(new.report_number, 'GA1 report'), 'needs repair')
      else concat_ws(' ', 'New GA1 report', new.report_number)
    end,
    concat_ws(' · ', nullif(new.equipment_type, ''), client, 'by ' || employee_name(actor)),
    'ga1', new.id);
  return new;
end;
$$;

drop trigger if exists notif_ga1_created on ga1_inspections;
create trigger notif_ga1_created after insert on ga1_inspections
  for each row execute function public.notif_ga1_created();

-- New request (website contact form, client portal, or a colleague).
create or replace function public.notif_request_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  client text;
begin
  select name into client from clients where id = new.client_id;
  perform notify_staff(
    'view:requests', current_employee_id(), 'request_created',
    'New request from ' || coalesce(client, 'a client'),
    new.title,
    'request', new.id);
  return new;
end;
$$;

drop trigger if exists notif_request_created on requests;
create trigger notif_request_created after insert on requests
  for each row execute function public.notif_request_created();

-- Orders placed from the website or the client portal.
do $$
begin
  if to_regclass('public.orders') is null then return; end if;

  create or replace function public.notif_order_created()
  returns trigger language plpgsql security definer set search_path = public as $f$
  declare
    client text;
  begin
    if new.source = 'admin' then return new; end if;
    select name into client from clients where id = new.client_id;
    perform notify_staff(
      'view:shop', current_employee_id(), 'order_created',
      'New order ' || new.number,
      coalesce(client, ''),
      'order', new.id);
    return new;
  end;
  $f$;

  drop trigger if exists notif_order_created on orders;
  create trigger notif_order_created after insert on orders
    for each row execute function public.notif_order_created();
end $$;

-- Quote approved (usually by the client in the portal).
create or replace function public.notif_quote_approved()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  client text;
begin
  if new.status = 'Approved' and old.status is distinct from 'Approved' then
    select name into client from clients where id = new.client_id;
    perform notify_staff(
      'create:records', current_employee_id(), 'quote_approved',
      'Quote ' || new.number || ' approved',
      concat_ws(' · ', client, new.title),
      'quote', new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists notif_quote_approved on quotes;
create trigger notif_quote_approved after update of status on quotes
  for each row execute function public.notif_quote_approved();

-- Invoice paid (card payment in the portal, or marked paid by a colleague).
create or replace function public.notif_invoice_paid()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  client text;
begin
  if new.status = 'Paid' and old.status is distinct from 'Paid' then
    select name into client from clients where id = new.client_id;
    perform notify_staff(
      'view:invoices', current_employee_id(), 'invoice_paid',
      'Invoice ' || new.number || ' paid',
      coalesce(client, ''),
      'invoice', new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists notif_invoice_paid on invoices;
create trigger notif_invoice_paid after update of status on invoices
  for each row execute function public.notif_invoice_paid();

-- Job marked complete (usually by the crew from the field app).
create or replace function public.notif_job_completed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'Complete' and old.status is distinct from 'Complete' then
    perform notify_staff(
      'create:records', current_employee_id(), 'job_completed',
      new.number || ' marked complete',
      concat_ws(' · ', new.title, 'by ' || employee_name(current_employee_id())),
      'job', new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists notif_job_completed on jobs;
create trigger notif_job_completed after update of status on jobs
  for each row execute function public.notif_job_completed();
