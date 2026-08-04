import { createClient } from '@supabase/supabase-js'

// Returns a short-lived signed URL for one of the client's own attachments.
// The attachments Storage bucket is private; we mint the URL server-side after
// confirming the signed-in client owns the file (their client record, or one
// of their jobs).
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  if (!url || !serviceKey) return res.status(500).json({ error: 'Not configured.' })

  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing bearer token' })

  const authed = createClient(url, anonKey || serviceKey, { auth: { persistSession: false } })
  const { data: userData, error: userErr } = await authed.auth.getUser(token)
  if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid session' })
  const uid = userData.user.id

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  // Resolve the caller's client (primary link or membership).
  const [{ data: ownClient }, { data: membership }] = await Promise.all([
    admin.from('clients').select('id').eq('auth_user_id', uid).maybeSingle(),
    admin.from('client_users').select('client_id').eq('auth_user_id', uid).maybeSingle(),
  ])
  const clientId = ownClient?.id || membership?.client_id
  if (!clientId) return res.status(403).json({ error: 'No client record linked to this login.' })

  const attachmentId = req.query.id
  if (!attachmentId) return res.status(400).json({ error: 'id required' })

  const { data: att } = await admin.from('attachments').select('entity_type, entity_id, path').eq('id', attachmentId).maybeSingle()
  if (!att) return res.status(404).json({ error: 'Not found' })

  // Ownership: a file on this client, or on one of this client's jobs.
  let owns = att.entity_type === 'client' && att.entity_id === clientId
  if (!owns && att.entity_type === 'job') {
    const { data: job } = await admin.from('jobs').select('id').eq('id', att.entity_id).eq('client_id', clientId).maybeSingle()
    owns = !!job
  }
  if (!owns) return res.status(403).json({ error: 'Not authorised' })

  const { data: signed, error } = await admin.storage.from('attachments').createSignedUrl(att.path, 300)
  if (error || !signed) return res.status(500).json({ error: 'Could not create download link.' })

  return res.status(200).json({ url: signed.signedUrl })
}
