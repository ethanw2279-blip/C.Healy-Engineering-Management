-- ============================================================================
-- Seed data for "Ethan Whitney Detailing" — mirrors src/data/seed.ts.
-- Run AFTER 0001_init.sql. Safe to re-run: it truncates first.
-- Employees are linked to real logins automatically when someone signs up with
-- the matching email (see handle_new_user trigger).
-- ============================================================================

truncate roles, employees, clients, requests, quotes, quote_items, jobs,
  job_items, job_assignees, invoices, invoice_items, time_entries, visits
  restart identity cascade;

-- Roles ----------------------------------------------------------------------
insert into roles (id, name, description, permissions, system) values
  ('role_dev', 'Developer', 'Complete access and control, including creating and editing roles.', array['*'], true),
  ('role_admin', 'Admin', 'Runs the business day-to-day: all pages, create records, manage the team.',
    array['view:dashboard','view:schedule','view:clients','view:requests','view:quotes','view:jobs','view:invoices','view:timesheets','view:team','view:reports','create:records','approve:timesheets','manage:team'], false),
  ('role_employee', 'Employee', 'Field crew: sees their schedule, jobs, clients and timesheets.',
    array['view:schedule','view:jobs','view:clients','view:timesheets'], false);

-- Employees ------------------------------------------------------------------
insert into employees (id, name, role_id, email, phone, hourly_rate, color, active) values
  ('00000000-0000-0000-0000-0000000000e1', 'Ethan Whitney', 'role_dev',      'ethan@ewdetailing.ie',  '087 123 4567', 0,  '#1F8A4C', true),
  ('00000000-0000-0000-0000-0000000000e2', 'Marcus Reilly', 'role_employee', 'marcus@ewdetailing.ie', '086 234 5678', 22, '#2F86EB', true),
  ('00000000-0000-0000-0000-0000000000e3', 'Sofia Nolan',   'role_employee', 'sofia@ewdetailing.ie',  '085 345 6789', 22, '#C7791C', true),
  ('00000000-0000-0000-0000-0000000000e4', 'Liam Byrne',    'role_employee', 'liam@ewdetailing.ie',   '083 456 7890', 20, '#7A2B3A', true),
  ('00000000-0000-0000-0000-0000000000e5', 'Aoife Kelly',   'role_admin',    'aoife@ewdetailing.ie',  '089 567 8901', 24, '#5B4FB5', true);

-- Clients --------------------------------------------------------------------
insert into clients (id, name, company, email, phone, address, status, created_at) values
  ('00000000-0000-0000-0000-0000000000c1', 'Ethan Whitney',       null,                  'ethan.w@gmail.com',      '087 111 2222', '2426 E Riverside Dr, Dublin', 'Lead',   '2026-07-06'),
  ('00000000-0000-0000-0000-0000000000c2', 'Marcus Reilly',       'Reilly Motors',       'info@reillymotors.ie',   '01 555 0143',  '18 Fairview Ave, Dublin',     'Active', '2026-06-21'),
  ('00000000-0000-0000-0000-0000000000c3', 'Dublin Fleet Co.',    'Dublin Fleet Co.',    'ops@dublinfleet.ie',     '01 555 0199',  'Point Village Depot, Dublin', 'Active', '2026-05-30'),
  ('00000000-0000-0000-0000-0000000000c4', 'Grainne O’Shea',      null,                  'grainne@osheahomes.ie',  '086 777 3311', '5 Temple Bar, Dublin',        'Active', '2026-06-11'),
  ('00000000-0000-0000-0000-0000000000c5', 'East Wall Logistics', 'East Wall Logistics', 'yard@eastwall.ie',       '01 555 0170',  '9 East Wall Rd, Dublin',      'Active', '2026-04-18'),
  ('00000000-0000-0000-0000-0000000000c6', 'Cian Murphy',         null,                  'cian.murphy@gmail.com',  '085 909 1212', '44 Marino Cres, Dublin',      'Lead',   '2026-07-02');

-- Requests -------------------------------------------------------------------
insert into requests (id, client_id, title, service, requested_on, status) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Full exterior detail enquiry', 'Exterior detail',  '2026-07-06', 'New'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000c6', 'Ceramic coating quote',        'Ceramic coating',  '2026-07-02', 'Assessment complete'),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c4', 'Interior valet for SUV',       'Interior valet',   '2026-06-28', 'Converted');

-- Quotes + items -------------------------------------------------------------
insert into quotes (id, number, client_id, title, status, created_at) values
  ('00000000-0000-0000-0000-0000000000b1', 'Q-1042', '00000000-0000-0000-0000-0000000000c1', 'Full exterior detail',   'Awaiting response', '2026-07-06'),
  ('00000000-0000-0000-0000-0000000000b2', 'Q-1041', '00000000-0000-0000-0000-0000000000c6', 'Ceramic coating package','Draft',             '2026-07-02'),
  ('00000000-0000-0000-0000-0000000000b3', 'Q-1039', '00000000-0000-0000-0000-0000000000c3', 'Fleet wash — monthly',   'Approved',          '2026-06-24'),
  ('00000000-0000-0000-0000-0000000000b4', 'Q-1038', '00000000-0000-0000-0000-0000000000c4', 'Interior valet',         'Converted',         '2026-06-20');

insert into quote_items (quote_id, name, qty, unit_price) values
  ('00000000-0000-0000-0000-0000000000b1', 'Exterior wash & decontamination', 1, 90),
  ('00000000-0000-0000-0000-0000000000b1', 'Machine polish', 1, 160),
  ('00000000-0000-0000-0000-0000000000b2', 'Paint correction', 1, 240),
  ('00000000-0000-0000-0000-0000000000b2', '5yr ceramic coating', 1, 550),
  ('00000000-0000-0000-0000-0000000000b3', 'Fleet exterior wash', 12, 35),
  ('00000000-0000-0000-0000-0000000000b4', 'Interior deep clean', 1, 130);

-- Jobs + items + assignees ---------------------------------------------------
insert into jobs (id, number, client_id, title, status, start_date, end_date) values
  ('00000000-0000-0000-0000-0000000000d1', 'J-2087', '00000000-0000-0000-0000-0000000000c2', 'Interior deep clean',    'Active',             '2026-07-07', '2026-07-07'),
  ('00000000-0000-0000-0000-0000000000d2', 'J-2086', '00000000-0000-0000-0000-0000000000c3', 'Fleet wash — 4 vehicles','Scheduled',          '2026-07-09', '2026-07-09'),
  ('00000000-0000-0000-0000-0000000000d3', 'J-2084', '00000000-0000-0000-0000-0000000000c4', 'Interior valet — SUV',   'Requires invoicing', '2026-07-01', '2026-07-01'),
  ('00000000-0000-0000-0000-0000000000d4', 'J-2081', '00000000-0000-0000-0000-0000000000c5', 'Van fleet monthly wash', 'Complete',           '2026-06-27', '2026-06-27'),
  ('00000000-0000-0000-0000-0000000000d5', 'J-2088', '00000000-0000-0000-0000-0000000000c6', 'Ceramic coating',        'Unscheduled',        null,         null);

insert into job_items (job_id, name, qty, unit_price) values
  ('00000000-0000-0000-0000-0000000000d1', 'Interior deep clean', 1, 130),
  ('00000000-0000-0000-0000-0000000000d2', 'Fleet exterior wash', 4, 35),
  ('00000000-0000-0000-0000-0000000000d3', 'Interior valet', 1, 130),
  ('00000000-0000-0000-0000-0000000000d4', 'Van wash', 6, 30),
  ('00000000-0000-0000-0000-0000000000d5', '5yr ceramic coating', 1, 550);

insert into job_assignees (job_id, employee_id) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000e3'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000e4'),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-0000000000e3'),
  ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-0000000000e4');

-- Invoices + items -----------------------------------------------------------
insert into invoices (id, number, client_id, job_id, status, issued_on, due_on) values
  ('00000000-0000-0000-0000-0000000000f1', 'INV-508', '00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-0000000000d3', 'Awaiting payment', '2026-07-02', '2026-07-16'),
  ('00000000-0000-0000-0000-0000000000f2', 'INV-505', '00000000-0000-0000-0000-0000000000c5', '00000000-0000-0000-0000-0000000000d4', 'Paid',             '2026-06-28', '2026-07-12'),
  ('00000000-0000-0000-0000-0000000000f3', 'INV-499', '00000000-0000-0000-0000-0000000000c3', null,                                   'Past due',         '2026-06-05', '2026-06-19');

insert into invoice_items (invoice_id, name, qty, unit_price) values
  ('00000000-0000-0000-0000-0000000000f1', 'Interior valet', 1, 130),
  ('00000000-0000-0000-0000-0000000000f2', 'Van wash', 6, 30),
  ('00000000-0000-0000-0000-0000000000f3', 'Fleet exterior wash', 12, 35);

-- Time entries ---------------------------------------------------------------
insert into time_entries (employee_id, job_id, date, hours, note, approved) values
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000d3', '2026-07-01', 2,   'Interior valet',        true),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000d1', '2026-07-07', 3.5, 'Deep clean',            false),
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000d2', '2026-07-09', 3,   'Fleet wash',            false),
  ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-0000000000d2', '2026-07-09', 3,   'Fleet wash',            false),
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000d4', '2026-06-27', 4,   'Van fleet',             true),
  ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-0000000000d4', '2026-06-27', 4,   'Van fleet',             true),
  ('00000000-0000-0000-0000-0000000000e5', null,                                   '2026-07-06', 6,   'Dispatch & scheduling', true),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000d1', '2026-07-08', 4,   'Finish deep clean',     false),
  ('00000000-0000-0000-0000-0000000000e5', null,                                   '2026-07-07', 6.5, 'Dispatch',              false),
  ('00000000-0000-0000-0000-0000000000e3', null,                                   '2026-07-10', 5,   'Detailing prep',        false);

-- Visits ---------------------------------------------------------------------
insert into visits (job_id, employee_id, date, start_time, end_time) values
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000e2', '2026-07-01', '10:00', '12:00'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000e2', '2026-07-07', '09:00', '11:00'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000e2', '2026-07-07', '13:30', '15:00'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000e2', '2026-07-08', '09:30', '12:30'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000e3', '2026-07-09', '11:00', '14:00'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000e4', '2026-07-09', '11:00', '14:00'),
  ('00000000-0000-0000-0000-0000000000d5', '00000000-0000-0000-0000-0000000000e3', '2026-07-13', '09:00', '13:00'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000e4', '2026-07-15', '08:30', '10:30'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000e5', '2026-07-20', '14:00', '16:00'),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000e3', '2026-07-22', '11:00', '12:30'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000e2', '2026-07-27', '09:00', '11:00');
