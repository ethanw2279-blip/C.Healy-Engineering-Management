import { createClient } from '@supabase/supabase-js'

// Public contact-form intake. Your website POSTs a JSON body here and it creates
// (or reuses) a Client and files a Request in the app. Uses the service-role key
// so it can write regardless of row-level security — the website never touches
// the database directly.
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
// Lock this to your site's origin in production (e.g. https://chealyengineering.ie).
const allowedOrigin = process.env.CONTACT_ALLOWED_ORIGIN || '*'
// Optional shared secret — set it AND send it as `x-form-secret` for server-side
// calls. Leave unset for a plain browser form (protected by the honeypot below).
const formSecret = process.env.CONTACT_FORM_SECRET

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-form-secret')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!url || !serviceKey) {
    return res.status(500).json({ error: 'Intake not configured (missing Supabase env vars).' })
  }
  if (formSecret && req.headers['x-form-secret'] !== formSecret) {
    return res.status(401).json({ error: 'Unauthorised' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  body = body || {}

  // Honeypot: bots fill hidden fields. Pretend success so they don't retry.
  if (body._gotcha || body.honeypot) return res.status(200).json({ ok: true })

  const name = (body.name || '').trim()
  const email = (body.email || '').trim()
  const phone = (body.phone || '').trim()
  const company = (body.company || '').trim()
  const service = (body.service || body.subject || '').trim()
  const message = (body.message || '').trim()

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email and message are required.' })
  }
  if (!isEmail(email)) return res.status(400).json({ error: 'Please provide a valid email address.' })

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  try {
    // Reuse an existing client with this email, otherwise create a new lead.
    let clientId
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .ilike('email', email)
      .limit(1)
      .maybeSingle()

    if (existing) {
      clientId = existing.id
    } else {
      const { data: created, error: cErr } = await supabase
        .from('clients')
        .insert({ name, email, phone, company: company || null, status: 'Lead' })
        .select('id')
        .single()
      if (cErr) throw cErr
      clientId = created.id
    }

    const title = service ? `Website enquiry — ${service}` : 'Website enquiry'
    const { error: rErr } = await supabase.from('requests').insert({
      client_id: clientId,
      title,
      service: service || 'Website enquiry',
      status: 'New',
      message,
    })
    if (rErr) throw rErr

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Contact intake failed:', e)
    return res.status(500).json({ error: 'Could not submit your enquiry. Please try again.' })
  }
}
