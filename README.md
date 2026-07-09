# C.Healy Engineering

A field-service / engineering-management platform built with React + Vite +
TypeScript, backed by Supabase (Postgres + Auth + Storage). It ships as **three
apps sharing one database**:

- **Admin web app** (`/`) — the office dashboard: clients, requests, quotes,
  jobs, invoices, scheduling, timesheets, GA1 inspections, team & roles.
- **Field mobile app** (`/field`) — the on-site crew app: today's work, clock
  in/out, timesheets, job photos, GA1, offline support and push notifications.
- **Client portal** (`/portal`) — a customer login to view their quotes, jobs
  and invoices, and approve quotes.

With Supabase configured, all three read and write the same database with
role- and row-level-security enforced access. Without it, the admin/field apps
fall back to an in-memory demo store (resets on reload) for local development.

## Going live — checklist

1. **Provision Supabase** and set the env vars (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`) in Vercel — see [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md).
2. **Run the migrations in order** in the Supabase SQL editor:
   `0001_init` → `0009_client_portal` (each file in
   [`supabase/migrations/`](supabase/migrations)). Paste the file *contents*,
   not the filename.
3. **Set your business details** in [`src/data/company.ts`](src/data/company.ts)
   (name, address, email, phone, VAT) — these brand the app and print on quotes
   and invoices.
4. **Deploy** (Vercel). The service worker + offline support activate over HTTPS.
5. **Add your team** — Admin → Team. Each member signs up at `/` with the email
   you gave them; the signup trigger links them to their record and role.
6. **Add your clients** — Admin → Clients (or convert requests → quotes → jobs).
7. **Invite clients to the portal** — make sure each has an email on file, then
   send them to `/portal` to create an account with that same email.
8. **(Optional) Push notifications** — generate VAPID keys and set the env vars,
   then have crew enable it in the field app's *More* tab (see `SUPABASE_SETUP.md`).

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

The app runs on Supabase (Postgres + Auth + Storage). When the env vars are
set it loads and persists everything through the database with a login gate;
without them it falls back to the in-memory demo store for local development.

- Schema, row-level security, and migrations live in
  [`supabase/migrations/`](supabase/migrations) (`0001`–`0009`). The data-access
  layer is `src/data/api.ts`; the Supabase client is in `src/lib/`.
- **Row-level security** policies map onto the same permission keys as
  `src/data/permissions.ts`, so roles edited in the app stay in sync with what
  the database allows. Staff, field crew, and portal clients each see only what
  their policies permit.
- Serverless functions in [`api/`](api/) handle GA1 PDF generation and web-push
  sending (they use the service-role key, which is **server-only** — never
  `VITE_`-prefixed).

See [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) for the full setup, migration, and
push-notification instructions.

## Design tokens

A deep teal-navy (`#16343B`), green (`#1F8A4C`), and warm neutral tiles
(`#E9E7E0`). See `src/theme/tokens.ts` and the CSS custom properties in
`src/index.css`.
