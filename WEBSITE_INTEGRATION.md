# Connecting your website to the app

Your website and this app share the same Supabase database, so records created
on the site appear in the app straight away. To keep the database safe, the
website never talks to Supabase directly — it POSTs to a small **server endpoint**
in this app, which validates the data and writes it with the secure service key.

## Contact form → Requests

A contact form on your site becomes a **Request** (with the message) and a
**Client** (a new "Lead", or the existing client if the email already exists) in
the app.

### Endpoint

```
POST https://<your-app-domain>/api/intake/contact
Content-Type: application/json
```

**Body fields**

| Field | Required | Notes |
| --- | --- | --- |
| `name` | ✅ | Person's name |
| `email` | ✅ | Used to match/create the client |
| `message` | ✅ | The enquiry text — shown on the Request |
| `phone` | — | Optional |
| `company` | — | Optional |
| `service` | — | What they're enquiring about (also accepts `subject`) |
| `_gotcha` | — | Honeypot — leave it hidden and empty; bots that fill it are silently dropped |

**Responses:** `200 {"ok": true}` on success; `400` for missing/invalid fields;
`401` if a form secret is required and wrong; `500` on a server problem.

### Drop-in example (plain HTML + JS)

```html
<form id="contact-form">
  <input name="name" placeholder="Your name" required />
  <input name="email" type="email" placeholder="Email" required />
  <input name="phone" placeholder="Phone (optional)" />
  <input name="service" placeholder="What do you need?" />
  <textarea name="message" placeholder="Your message" required></textarea>
  <!-- Honeypot: hidden from people, tempting to bots. Keep it visually hidden. -->
  <input name="_gotcha" tabindex="-1" autocomplete="off"
         style="position:absolute;left:-9999px" aria-hidden="true" />
  <button type="submit">Send</button>
</form>

<script>
  const form = document.getElementById('contact-form')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(form).entries())
    const res = await fetch('https://<your-app-domain>/api/intake/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      form.reset()
      alert('Thanks — we’ll be in touch shortly.')
    } else {
      const { error } = await res.json().catch(() => ({}))
      alert(error || 'Something went wrong. Please try again.')
    }
  })
</script>
```

Replace `<your-app-domain>` with your deployed app URL (e.g. your Vercel domain
or custom domain).

### Configuration (Vercel environment variables)

| Variable | Needed? | Purpose |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ (already set) | Lets the endpoint write to the DB |
| `VITE_SUPABASE_URL` | ✅ (already set) | Your Supabase project URL |
| `CONTACT_ALLOWED_ORIGIN` | Recommended | Set to your site's origin (e.g. `https://chealyengineering.ie`) so only your site can call it. Defaults to `*` (any origin). |
| `CONTACT_FORM_SECRET` | Optional | If set, the caller must send header `x-form-secret: <value>`. Use this only for **server-to-server** calls — don't put a secret in browser JavaScript, where anyone can read it. For a normal browser form, rely on the honeypot + `CONTACT_ALLOWED_ORIGIN` instead. |

### Before it works

Run migration `supabase/migrations/0010_request_message.sql` in the Supabase SQL
editor (adds the `message` column to requests), then deploy.

### What you'll see in the app

Each submission shows up under **Requests** with the person as the client and
their message on the request. From there you can convert it to a quote → job →
invoice like any other enquiry.

---

## Coming next

The same pattern extends to the rest of what you asked about:

- **Shop orders → Invoices + client portal** — a checkout endpoint creates the
  client + invoice; it then appears in the app and in that client's portal.
- **Stock / inventory** — a new Products area with stock levels that go down as
  items sell.
- **Online payment (Stripe)** — take card payment at checkout and auto-mark the
  invoice paid.
