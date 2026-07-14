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

## Shop: product catalogue + orders

Manage products and stock in the app under **Products**, and orders under
**Orders**. Your website can read the live catalogue and submit orders.

> Run migration `supabase/migrations/0011_shop.sql` once before using these.

### Read the catalogue (for your shop pages)

```
GET https://<your-app-domain>/api/shop/products
```

Returns only **active** products with live stock:

```json
{ "products": [
  { "id": "…", "name": "Steel Lifting Hook — 2t", "sku": "HK-2T",
    "description": "Grade 80 clevis hook", "price": 45, "stock": 21, "inStock": true }
] }
```

Use `id` or `sku` when placing an order.

### Place an order (checkout, no payment yet)

```
POST https://<your-app-domain>/api/intake/order
Content-Type: application/json
```

```json
{
  "customer": { "name": "Karen Whitey", "email": "k@example.com", "phone": "086…" },
  "items": [
    { "sku": "HK-2T", "qty": 2 },
    { "productId": "…", "qty": 1 }
  ],
  "note": "Leave at reception",
  "_gotcha": ""
}
```

On success it: reuses/creates the customer, files an **Order**, **draws down
stock**, and raises an **Invoice** (status *Awaiting payment*) — so the sale
shows in the app **and** in that customer's portal. Response:

```json
{ "ok": true, "orderNumber": "ORD-1002", "invoiceNumber": "INV-1005", "total": 102 }
```

Errors: `400` (missing/invalid fields), `409` (not enough stock, with a message
naming the product), `500` (server problem). Each item needs `qty ≥ 1` and a
valid `sku` or `productId`.

### Example checkout call

```js
const res = await fetch('https://<your-app-domain>/api/intake/order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer: { name, email, phone },
    items: cart.map((line) => ({ sku: line.sku, qty: line.qty })),
  }),
});
const result = await res.json();
if (res.ok) showThankYou(result.orderNumber);
else showError(result.error);
```

Both shop endpoints honour the same `CONTACT_ALLOWED_ORIGIN` setting as the
contact form, so locking that to your site covers all three.

## Coming next

- **Online payment (Stripe)** — take card payment at checkout and auto-mark the
  invoice **Paid** (right now shop invoices are raised as *Awaiting payment*).
- **Order confirmation emails** to the customer.
