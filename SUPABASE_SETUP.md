# Supabase setup

This guide gets a real database running behind the app. **Phase 1** (this) is
the database itself; **Phase 2** wires the app pages and login to it.

The app still runs on its in-memory demo store until Phase 2 — nothing here
breaks the current build.

## What you'll do

1. Create a Supabase project.
2. Run the schema + seed SQL.
3. Put the connection keys into env vars (local + Vercel).
4. Create the first login and confirm it maps to a role.

Then tell me it's connected and I'll do **Phase 2** (swap the data layer to
Supabase + add the login screen).

---

## 1. Create a project

1. Sign up at <https://supabase.com> and create a **new project**.
2. Pick a strong database password (save it) and a region near you (e.g. EU West).
3. Wait for it to finish provisioning (~2 min).

## 2. Run the schema and seed

In the Supabase dashboard → **SQL Editor**:

1. New query → paste the entire contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → **Run**.
2. New query → paste [`supabase/seed.sql`](supabase/seed.sql) → **Run**.

You should now see the tables under **Table Editor** (clients, jobs, quotes,
invoices, employees, roles, …) populated with the sample data.

> Prefer the CLI? `supabase link` then `supabase db push` works too — the SQL
> lives in `supabase/`.

## 3. Get your keys

Dashboard → **Project settings → API**. Copy:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** key → `VITE_SUPABASE_ANON_KEY`

The **anon key is safe to expose** in the browser — row-level security (already
in the schema) is what actually protects the data, not key secrecy. Do **not**
use the `service_role` key in the front end.

### Local

Copy `.env.example` to `.env.local` and fill in both values. `.env.local` is
gitignored.

```bash
cp .env.example .env.local
# then edit .env.local
```

### Vercel

Project → **Settings → Environment Variables** → add both `VITE_SUPABASE_URL`
and `VITE_SUPABASE_ANON_KEY` (Production + Preview), then redeploy.

## 4. Create the first user

Login is **email + password**. Employees are pre-seeded, and a trigger links a
new login to the employee row with the **same email** on first sign-up.

To sign in as the owner (Developer role):

1. Dashboard → **Authentication → Users → Add user**.
2. Email `ethan@ewdetailing.ie`, set a password, and tick **Auto Confirm User**.
3. That user is now linked to the seeded Ethan Whitney employee → **Developer**
   → full access.

Repeat with the other seeded emails to test other roles (e.g.
`marcus@ewdetailing.ie` = Employee, `aoife@ewdetailing.ie` = Admin). Any email
that doesn't match a seeded employee will sign in but have **no role** (no
access) until you add them on the Team page.

## 5. Sanity check the permissions (optional)

In the SQL editor you can confirm RLS is working. Run as an authenticated user
from the app in Phase 2, but for now you can eyeball the policies under
**Authentication → Policies** — every table should show policies referencing
`has_perm(...)`.

---

## How security works here

- Each login (`auth.users`) links to one `employees` row via `auth_user_id`.
- That employee has a `role_id`; the role holds a `permissions` array (or
  `{'*'}` for the Developer).
- The `has_perm('view:clients')` SQL function checks the signed-in user's role.
- **Row-level security policies** on every table call `has_perm(...)`, so an
  Employee genuinely cannot read `time_entries` payroll data or write clients —
  the database refuses it, regardless of the UI.

This mirrors `src/data/permissions.ts` exactly, so the roles you edit in the app
and the database enforcement stay in sync.

## When you're done

Tell me **"Supabase is connected"** and I'll start Phase 2:

- add `@tanstack/react-query` and a typed data-access layer (`src/data/api.ts`)
- convert each page's create/update/delete/read to Supabase calls
- add the login screen and session gate, and retire the demo "Viewing as"
  switcher (kept only for local dev)

---

## Offline support & push notifications

### Offline (no setup needed)

The field app now works offline:

- A **service worker** (`public/sw.js`) caches the app shell so it opens with no
  signal. It registers automatically on the deployed site (production only).
- The last-loaded data is cached in the browser, so screens render instantly.
- Any change made offline (mark job complete, log time, etc.) is queued in a
  **write outbox** and replayed automatically when the connection returns. A
  banner shows "Offline — changes will sync…" while you're disconnected.

Nothing to configure — it activates once deployed over HTTPS.

### Push notifications (needs VAPID keys)

Crew members get a push when they're assigned to a job.

**1. Run the migration** — in the SQL editor, run `supabase/migrations/0008_push.sql`.

**2. Generate VAPID keys** — run once locally:

```
npx web-push generate-vapid-keys
```

It prints a **Public Key** and **Private Key**.

**3. Set Vercel environment variables** (Project → Settings → Environment Variables):

| Variable | Value |
| --- | --- |
| `VITE_VAPID_PUBLIC_KEY` | the public key (safe to expose — it's in the browser) |
| `VAPID_PRIVATE_KEY` | the private key — **server-only, never `VITE_`-prefixed** |
| `VAPID_SUBJECT` | `mailto:you@yourdomain.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | already set for GA1 PDFs — reused by the sender |

**4. Redeploy.** Then on a phone, open the app → **More → Push notifications →
On**, accept the browser prompt. Assigning that person to a job from the admin
app sends them a notification that deep-links to the job.

> iOS note: push works only when the app is **installed to the Home Screen**
> (Add to Home Screen in Safari) — iOS doesn't deliver web push to the browser
> tab. Requires iOS 16.4+.
