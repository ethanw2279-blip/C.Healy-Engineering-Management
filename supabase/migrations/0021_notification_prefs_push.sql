-- ============================================================================
-- Notification settings per person, phone push for every notification, and a
-- "hours waiting for approval" alert. Run after 0020_notifications.sql.
-- ============================================================================

-- ── Per-person settings ─────────────────────────────────────────────────────
-- Kinds listed in off_kinds aren't created for that person at all; kinds in
-- no_push_kinds still show in the app but don't buzz their phone.
create table if not exists notification_prefs (
  employee_id   uuid primary key references employees (id) on delete cascade,
  off_kinds     text[] not null default '{}',
  no_push_kinds text[] not null default '{}',
  updated_at    timestamptz not null default now()
);

alter table notification_prefs enable row level security;
drop policy if exists "manage own notification prefs" on notification_prefs;
create policy "manage own notification prefs" on notification_prefs for all to authenticated
  using (employee_id in (select id from employees where auth_user_id = auth.uid()))
  with check (employee_id in (select id from employees where auth_user_id = auth.uid()));

-- Same as 0020, plus: skip kinds the recipient has switched off.
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
  if exists (select 1 from notification_prefs where employee_id = p_recipient and p_kind = any (off_kinds)) then
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

-- ── New visits coalesce ─────────────────────────────────────────────────────
-- A recurring job adds a visit per day; that's one notification, not twenty.
create or replace function public.notif_visit_added()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  label text;
begin
  select number || ' · ' || title into label from jobs where id = new.job_id;
  label := coalesce(nullif(new.title, ''), label, 'Visit');
  perform notify_employee(
    new.employee_id, current_employee_id(), 'visit_added',
    '{n} new visit{s} on your schedule',
    label || ' · ' || to_char(new.date, 'Dy DD Mon') || ' at ' || new.start_time,
    case when new.job_id is not null then 'job' else 'schedule' end,
    coalesce(new.job_id, new.id), true);
  return new;
end;
$$;

-- ── Hours waiting for approval ──────────────────────────────────────────────
create or replace function public.notif_time_submitted()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  actor uuid := coalesce(current_employee_id(), new.employee_id);
begin
  if new.approved then return new; end if;
  perform notify_staff(
    'approve:timesheets', actor, 'time_submitted',
    employee_name(new.employee_id) || ' logged {n} time entr{ies}',
    'Waiting for your approval',
    'timesheet', new.employee_id, true);
  return new;
end;
$$;

drop trigger if exists notif_time_submitted on time_entries;
create trigger notif_time_submitted after insert on time_entries
  for each row execute function public.notif_time_submitted();

-- ── Phone push ──────────────────────────────────────────────────────────────
-- Each new notification asks the app's /api/notify endpoint to push it to the
-- recipient's devices. The endpoint URL and shared secret live here; nobody
-- signed in can read this table (RLS on, no policies).
create table if not exists notification_settings (
  id          boolean primary key default true check (id), -- single row
  push_url    text,
  push_secret text
);
alter table notification_settings enable row level security;
revoke all on notification_settings from anon, authenticated;

-- pg_net makes the HTTP call after the transaction commits. It ships with
-- Supabase; elsewhere push simply stays off.
do $$
begin
  create extension if not exists pg_net with schema extensions;
exception when others then
  raise notice 'pg_net unavailable, phone push disabled: %', sqlerrm;
end $$;

create or replace function public.notif_send_push()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cfg record;
begin
  select push_url, push_secret into cfg from notification_settings limit 1;
  if cfg.push_url is null or to_regnamespace('net') is null then
    return new;
  end if;
  perform net.http_post(
    url     := cfg.push_url,
    body    := jsonb_build_object('notificationId', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', coalesce(cfg.push_secret, ''))
  );
  return new;
exception when others then
  -- Push is best-effort; never block the action that caused it.
  return new;
end;
$$;

drop trigger if exists notif_send_push on notifications;
create trigger notif_send_push after insert on notifications
  for each row execute function public.notif_send_push();
