# Jobber Clone

A clone of the [Jobber](https://getjobber.com) field-service / construction
management platform, built with React + Vite + TypeScript. It ships as **two
apps sharing one data store**:

- **Admin web app** (`/`) — the office/back-office dashboard: manage clients,
  create quotes / jobs / invoices, and track every employee's hours.
- **Field mobile app** (`/field`) — the on-site crew app with clock in/out
  (the original mobile UI).

Both read and write the same in-memory store (`src/data/store.tsx`), so a quote
or client created in the admin app is immediately reflected everywhere.

## Admin web app (`/`)

A desktop dashboard with a left sidebar, top bar with global search, and a
**+ Create** menu that opens modal forms for every record type.

| Page | Notes |
| --- | --- |
| **Dashboard** | KPI cards (outstanding invoices, pipeline, active jobs, team hours) + recent quotes and upcoming jobs |
| **Schedule** | Everyone's visits grouped by day, with assigned crew |
| **Clients** | Filterable table (Lead/Active/Archived) + create client |
| **Requests** | Incoming enquiries + create request |
| **Quotes** | Filterable list with line-item totals + create quote |
| **Jobs** | Status pipeline (Unscheduled → Complete), assigned crew + create job |
| **Invoices** | Outstanding total, statuses (Draft/Awaiting/Past due/Paid) + create invoice |
| **Timesheets** | **Every employee's hours**, pending approval, estimated labour cost, per-entry + bulk approve |
| **Team** | Add / edit / remove members and assign roles |
| **Roles & permissions** | Create and edit roles; toggle exactly what each role can see and do |
| **Reports** | Revenue, pipeline, win rate, labour cost, job value by client |

## Roles & permissions (RBAC)

Every team member has a **role**, and each role holds a set of **permissions**
that control which pages they see and which actions they can take. Roles are
data-driven and editable in the app.

**Default roles**

| Role | Access |
| --- | --- |
| **Developer** | Complete access and control (a system role — always full access, can't be deleted). |
| **Admin** | Every page + create records + approve timesheets + manage the team. Cannot edit roles. |
| **Employee** | Schedule, Jobs, Clients and Timesheets only. No create, no admin. |

**How permissions are enforced**
- The sidebar only lists pages the current role can view.
- Visiting a page you can't access bounces you to your first allowed page (or a
  "No access" screen).
- The **+ Create** button, timesheet **Approve** buttons, and team-management
  controls only appear when your role allows them.

**Previewing a role** — use the **"Viewing as"** switcher in the top bar to see
the app as any team member. The sidebar, buttons and pages update instantly to
match that person's role. (This resets to the owner on a full page reload, since
data is in-memory.)

### How to create or edit a role

1. Go to **Roles & permissions** in the sidebar (needs the *Create & edit roles*
   permission — Developer has it by default).
2. Click **New role** (or **Edit** on an existing card).
3. Give it a **name** and **description**, then tick the permissions it should
   have, grouped into **Pages**, **Actions**, and **Administration**.
4. **Save** — assign it to people from the **Team** page (click a member →
   choose the role).

Delete a role from its card. A role can't be deleted while members are still
assigned to it (reassign them first), and the Developer role is protected.

To change the *defaults* in code, edit `src/data/permissions.ts`
(`defaultRoles` and the `PERMISSION_GROUPS` catalog).

**Create flows** — quotes, jobs and invoices use a shared line-item editor with
live totals; jobs let you assign crew and set schedule dates. New records get an
auto-incremented number (Q-, J-, INV-) and appear immediately in their list.

## Field mobile app (`/field`)

| Tab | Status | Notes |
| --- | --- | --- |
| **Home** | ✅ | Greeting, live Clock In/Out timer, map hero, This week, To do, Business health |
| **Schedule** | ✅ | Week-day strip with per-day visit cards and status badges |
| **Timesheet** | ✅ | Week summary with per-day hours and bars |
| **Search** | ✅ | Search bar, Clients/Requests/Quotes filters, Recently active |
| **More** | ✅ | Company header, tiles, settings menu, logout |

A bottom tab bar with a floating action button, mirroring the native app.
**Clock In** on the Home tab starts a live running timer and flips to
**Clock Out**.

## iOS support (field app)

The app is built to run as an installable, native-feeling iOS web app:

- **Safe areas** — headers clear the notch and the tab bar / FAB clear the home
  indicator via `env(safe-area-inset-*)` and `viewport-fit=cover`.
- **Add to Home Screen** — `manifest.webmanifest`, an `apple-touch-icon`, and
  the `apple-mobile-web-app-*` meta tags let it launch standalone (no browser
  chrome).
- **Native touch feel** — no tap-highlight flash, no double-tap zoom / 300ms
  delay (`touch-action: manipulation`), and no rubber-band page bounce
  (`overscroll-behavior`).

Add it from Safari via **Share → Add to Home Screen** to run it full-screen.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Project structure

```
src/
  admin/         # Admin web app
    pages/       # One file per admin page (Dashboard, Clients, Quotes, …)
    components/  # Admin UI kit (Button, Modal, Table, StatusBadge, …)
    AdminLayout, Sidebar, Topbar, CreateModals
  mobile/        # Field mobile app router
  screens/       # Field app screens (Home, Schedule, Timesheet, Search, More)
  components/    # Shared mobile UI + the icon set
  data/          # types.ts, seed.ts, store.tsx (shared state for both apps)
  theme/         # Design tokens
  App.tsx        # Top-level routes: /field → mobile, /* → admin
  main.tsx       # Entry point (wraps app in StoreProvider)
```

## Database (Supabase)

The app currently runs on an in-memory demo store (resets on reload). The
Supabase backend that replaces it is being added in phases:

- **Phase 1 (done):** schema, row-level security, and seed SQL live in
  [`supabase/`](supabase/); the Supabase client is in `src/lib/`. See
  [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) to provision a project and load it.
- **Phase 2 (next):** wire the pages and a login screen to Supabase so data
  persists and role permissions are enforced by the database.

Row-level security policies map onto the same permission keys as
`src/data/permissions.ts`, so roles edited in the app stay in sync with what the
database allows.

## Design tokens

Colors are derived from the app screenshots — a deep teal-navy (`#16343B`),
Jobber green (`#1F8A4C`), and warm neutral tiles (`#E9E7E0`). See
`src/theme/tokens.ts` and the CSS custom properties in `src/index.css`.
