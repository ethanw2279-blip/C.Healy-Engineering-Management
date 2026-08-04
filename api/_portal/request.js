import { createClient } from '@supabase/supabase-js'

// Authenticated portal "Request work" intake. The signed-in client posts what
// they need; we file a Request against their own client record. Uses the
// service-role key after verifying the caller owns the client (RLS lets a
// client read but not insert requests).
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!url || !serviceKey) return res.status(500).json({ error: 'Not configured. Set SUPABASE_SERVICE_ROLE_KEY (and VITE_SUPABASE_URL).' })

  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing bearer token' })

  const authed = createClient(url, anonKey || serviceKey, { auth: { persistSession: false } })
  const { data: userData, error: userErr } = await authed.auth.getUser(token)
  if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid session' })

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
  const { data: client } = await admin.from('clients').select('id').eq('auth_user_id', userData.user.id).maybeSingle()
  if (!client) return res.status(403).json({ error: 'No client record linked to this login.' })

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  body = body || {}
  const service = String(body.service || '').trim() || 'General enquiry'
  const details = String(body.details || '').trim()
  const site = String(body.site || '').trim()
  const urgency = String(body.urgency || '').trim()

  const parts = [urgency && `Urgency: ${urgency}`, site && `Site: ${site}`, details].filter(Boolean)
  const title = service

  const { data: inserted, error } = await admin.from('requests').insert({
    client_id: client.id,
    title,
    service,
    status: 'New',
    message: parts.join('\n') || null,
  }).select('id').single()
  if (error) {
    console.error('Portal request insert failed:', error)
    return res.status(500).json({ error: 'Could not file your request. Please try again.' })
  }

  return res.status(200).json({ ok: true, id: inserted.id })
}
