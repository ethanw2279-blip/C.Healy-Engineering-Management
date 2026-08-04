import { createClient } from '@supabase/supabase-js'

// Verifies a returned Stripe Checkout session and, if it settled, marks the
// client's invoice paid. Called when Stripe redirects back to /portal/pay.
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  if (!url || !serviceKey) return res.status(500).json({ error: 'Not configured.' })
  if (!STRIPE_SECRET_KEY) return res.status(501).json({ error: 'Payments not enabled.' })

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

  const sessionId = req.query.session_id
  if (!sessionId) return res.status(400).json({ error: 'session_id required' })

  try {
    const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    })
    const session = await r.json()
    if (!r.ok) return res.status(502).json({ error: 'Could not verify the payment.' })

    const invoiceId = session?.metadata?.invoice_id
    const paid = session?.payment_status === 'paid'
    if (!invoiceId || !paid) return res.status(200).json({ paid: false })

    // Confirm the invoice belongs to this client, then mark it paid.
    const { data: invoice } = await admin.from('invoices').select('id, number, client_id, status').eq('id', invoiceId).maybeSingle()
    if (!invoice || invoice.client_id !== clientId) return res.status(403).json({ error: 'Not your invoice.' })
    if (invoice.status !== 'Paid') await admin.from('invoices').update({ status: 'Paid' }).eq('id', invoiceId)

    return res.status(200).json({ paid: true, invoiceNumber: invoice.number })
  } catch (e) {
    console.error('Pay confirm failed:', e)
    return res.status(500).json({ error: 'Could not verify the payment.' })
  }
}
