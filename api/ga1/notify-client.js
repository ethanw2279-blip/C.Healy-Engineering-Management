import { createClient } from '@supabase/supabase-js'

// Emails a client to say their GA1 reports are ready, with a link that takes
// them to the portal — where they either sign in or create an account (linked
// by matching email) and land on their GA1 register.
//
// Sending uses Resend's REST API (no SDK dependency). If the email env vars
// aren't set, the endpoint returns a clear 501 so the UI can degrade cleanly.
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.GA1_EMAIL_FROM || process.env.EMAIL_FROM

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!url || !serviceKey) return res.status(500).json({ error: 'Not configured. Set SUPABASE_SERVICE_ROLE_KEY (and VITE_SUPABASE_URL).' })

  // Require a valid staff session.
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing bearer token' })

  const authed = createClient(url, anonKey || serviceKey, { auth: { persistSession: false } })
  const { data: userData, error: userErr } = await authed.auth.getUser(token)
  if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid session' })

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
  const { data: emp } = await admin.from('employees').select('id').eq('auth_user_id', userData.user.id).maybeSingle()
  if (!emp) return res.status(403).json({ error: 'Staff access required' })

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  const clientId = (body || {}).clientId
  if (!clientId) return res.status(400).json({ error: 'clientId required' })

  const { data: client, error: cErr } = await admin
    .from('clients').select('name, email').eq('id', clientId).single()
  if (cErr || !client) return res.status(404).json({ error: 'Client not found' })
  if (!client.email) return res.status(400).json({ error: 'This client has no email address on file.' })

  const { count } = await admin
    .from('ga1_inspections').select('id', { count: 'exact', head: true }).eq('client_id', clientId)

  if (!RESEND_API_KEY || !EMAIL_FROM) {
    return res.status(501).json({ error: 'Email sending is not configured. Set RESEND_API_KEY and GA1_EMAIL_FROM in your environment.' })
  }

  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0]
  const base = process.env.PORTAL_BASE_URL || `${proto}://${req.headers.host}`
  const portalLink = `${base}/portal/ga1?email=${encodeURIComponent(client.email)}`
  const n = count || 0
  const reportsPhrase = n === 1 ? 'your GA1 report is' : `${n} GA1 reports are`

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#1c2733;font-size:15px;line-height:1.5">
      <p>Hi ${esc(client.name || '')},</p>
      <p>${n ? `Your ${reportsPhrase} ready to view` : 'Your GA1 reports are ready to view'} in your C.Healy Engineering client portal.</p>
      <p>
        <a href="${portalLink}" style="display:inline-block;background:#1c3a5e;color:#fff;text-decoration:none;padding:11px 20px;border-radius:6px;font-weight:bold">
          View your GA1 reports
        </a>
      </p>
      <p style="color:#555;font-size:13px">
        First time here? The link lets you create an account using this email address
        (${esc(client.email)}). If you already have an account, just sign in and you'll
        go straight to your reports, where you can also download your full register.
      </p>
      <p style="color:#888;font-size:12px">If the button doesn't work, paste this link into your browser:<br>${esc(portalLink)}</p>
      <p>Kind regards,<br>C.Healy Engineering</p>
    </div>`

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [client.email],
        subject: 'Your GA1 inspection reports are ready',
        html,
      }),
    })
    if (!r.ok) {
      const detail = await r.text().catch(() => '')
      console.error('Resend failed:', r.status, detail)
      return res.status(502).json({ error: 'The email provider rejected the request.' })
    }
    return res.status(200).json({ ok: true, sentTo: client.email, reportCount: n })
  } catch (e) {
    console.error('Email send failed:', e)
    return res.status(500).json({ error: 'Could not send the email. Please try again.' })
  }
}
