import { createClient } from '@supabase/supabase-js'

// Emails an invitee a link to join a client's portal account. The membership
// row itself is created by the portal (RLS-guarded) before this is called;
// this just sends the "you've been invited" email. Uses Resend; degrades to a
// 501 if email isn't configured (the invite still works — the person can sign
// up with the invited email and be auto-linked).
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.GA1_EMAIL_FROM || process.env.EMAIL_FROM

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s || '')
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

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
    admin.from('clients').select('id, name').eq('auth_user_id', userData.user.id).maybeSingle(),
    admin.from('client_users').select('client_id').eq('auth_user_id', userData.user.id).maybeSingle(),
  ])
  const clientId = ownClient?.id || membership?.client_id
  if (!clientId) return res.status(403).json({ error: 'No client record linked to this login.' })

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  const email = String((body || {}).email || '').trim()
  if (!isEmail(email)) return res.status(400).json({ error: 'A valid email is required.' })

  const { data: client } = await admin.from('clients').select('name').eq('id', clientId).single()

  if (!RESEND_API_KEY || !EMAIL_FROM) {
    return res.status(501).json({ error: 'Email is not configured, but the invite was added — they can sign up with this email to join.' })
  }

  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0]
  const base = process.env.PORTAL_BASE_URL || `${proto}://${req.headers.host}`
  const link = `${base}/portal?email=${encodeURIComponent(email)}`
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#1c2733;font-size:15px;line-height:1.5">
      <p>Hi,</p>
      <p>You've been invited to the <strong>${esc(client?.name || '')}</strong> account on the C.Healy Engineering client portal.</p>
      <p><a href="${link}" style="display:inline-block;background:#14161a;color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:bold">Create your account</a></p>
      <p style="color:#555;font-size:13px">Sign up using this email address (${esc(email)}) and you'll be linked automatically.</p>
      <p>C.Healy Engineering</p>
    </div>`

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_FROM, to: [email], subject: `You've been added to the ${client?.name || 'C.Healy'} portal`, html }),
    })
    if (!r.ok) { const d = await r.text().catch(() => ''); console.error('Resend invite failed:', r.status, d); return res.status(502).json({ error: 'Invite added, but the email could not be sent.' }) }
    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Invite email failed:', e)
    return res.status(500).json({ error: 'Invite added, but the email could not be sent.' })
  }
}
