import { createClient } from '@supabase/supabase-js'

// Starts a Stripe Checkout session for one of the client's own invoices and
// returns the hosted-payment URL. Stripe is called over REST (no SDK). If
// STRIPE_SECRET_KEY isn't set, returns 501 so the portal falls back to bank
// transfer.
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!url || !serviceKey) return res.status(500).json({ error: 'Not configured.' })

  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing bearer token' })

  const authed = createClient(url, anonKey || serviceKey, { auth: { persistSession: false } })
  const { data: userData, error: userErr } = await authed.auth.getUser(token)
  if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid session' })

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
  const [{ data: ownClient }, { data: membership }] = await Promise.all([
    admin.from('clients').select('id').eq('auth_user_id', userData.user.id).maybeSingle(),
    admin.from('client_users').select('client_id').eq('auth_user_id', userData.user.id).maybeSingle(),
  ])
  const clientId = ownClient?.id || membership?.client_id
  if (!clientId) return res.status(403).json({ error: 'No client record linked to this login.' })

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  const invoiceId = (body || {}).invoiceId
  if (!invoiceId) return res.status(400).json({ error: 'invoiceId required' })

  const { data: invoice } = await admin.from('invoices').select('id, number, status, client_id').eq('id', invoiceId).maybeSingle()
  if (!invoice || invoice.client_id !== clientId) return res.status(403).json({ error: 'Not your invoice.' })
  if (invoice.status === 'Paid') return res.status(409).json({ error: 'This invoice is already paid.' })

  const { data: items } = await admin.from('invoice_items').select('qty, unit_price').eq('invoice_id', invoiceId)
  const total = (items || []).reduce((s, it) => s + Number(it.qty) * Number(it.unit_price), 0)
  const amount = Math.round(total * 100)
  if (amount <= 0) return res.status(400).json({ error: 'Nothing to pay on this invoice.' })

  if (!STRIPE_SECRET_KEY) {
    return res.status(501).json({ error: 'Card payments are not enabled yet. Please pay by bank transfer.' })
  }

  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0]
  const base = process.env.PORTAL_BASE_URL || `${proto}://${req.headers.host}`

  const params = new URLSearchParams()
  params.set('mode', 'payment')
  params.set('success_url', `${base}/portal/pay?session_id={CHECKOUT_SESSION_ID}`)
  params.set('cancel_url', `${base}/portal/invoices`)
  params.set('client_reference_id', invoice.id)
  params.set('metadata[invoice_id]', invoice.id)
  params.set('line_items[0][quantity]', '1')
  params.set('line_items[0][price_data][currency]', 'eur')
  params.set('line_items[0][price_data][unit_amount]', String(amount))
  params.set('line_items[0][price_data][product_data][name]', `Invoice ${invoice.number}`)

  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    const session = await r.json()
    if (!r.ok || !session.url) {
      console.error('Stripe session failed:', session?.error?.message || r.status)
      return res.status(502).json({ error: 'Could not start the payment. Please try bank transfer.' })
    }
    return res.status(200).json({ url: session.url })
  } catch (e) {
    console.error('Stripe request failed:', e)
    return res.status(500).json({ error: 'Could not start the payment.' })
  }
}
