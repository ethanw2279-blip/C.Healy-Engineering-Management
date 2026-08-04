import { PassThrough } from 'stream'
import { createClient } from '@supabase/supabase-js'
import { generateRegisterPDF } from '../_ga1register.js'

// Streams a client's GA1 register (schedule of examinations) as a PDF.
// Auth: staff (an employee login) may request any client's register via
// ?clientId=…; a client login always gets its own, ignoring the query.
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  if (!url || !serviceKey) {
    return res.status(500).json({ error: 'Register service not configured. Set SUPABASE_SERVICE_ROLE_KEY (and VITE_SUPABASE_URL).' })
  }

  // Require a valid Supabase session.
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing bearer token' })

  const authed = createClient(url, anonKey || serviceKey, { auth: { persistSession: false } })
  const { data: userData, error: userErr } = await authed.auth.getUser(token)
  if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid session' })
  const uid = userData.user.id

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  // Staff (has an employee login) may target any client; otherwise a client
  // login is scoped to its own linked record.
  const [{ data: emp }, { data: ownClient }] = await Promise.all([
    admin.from('employees').select('id').eq('auth_user_id', uid).maybeSingle(),
    admin.from('clients').select('id').eq('auth_user_id', uid).maybeSingle(),
  ])

  let clientId
  if (emp) {
    clientId = req.query.clientId
    if (!clientId) return res.status(400).json({ error: 'clientId required' })
  } else if (ownClient) {
    clientId = ownClient.id
  } else {
    return res.status(403).json({ error: 'Not authorised' })
  }

  const [{ data: client, error: cErr }, { data: rows }] = await Promise.all([
    admin.from('clients').select('name, company, email, phone, address').eq('id', clientId).single(),
    admin.from('ga1_inspections').select('*').eq('client_id', clientId).order('examination_date', { ascending: false }),
  ])
  if (cErr || !client) return res.status(404).json({ error: 'Client not found' })

  const chunks = []
  const pass = new PassThrough()
  pass.on('data', (chunk) => chunks.push(chunk))
  pass.on('end', () => {
    const pdf = Buffer.concat(chunks)
    const safeName = String(client.company || client.name || 'client').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="GA1-Register-${safeName || 'client'}.pdf"`)
    res.setHeader('Content-Length', pdf.length)
    res.end(pdf)
  })
  pass.on('error', (err) => {
    console.error('Register PDF error:', err)
    if (!res.headersSent) res.status(500).json({ error: 'Register generation failed' })
  })

  generateRegisterPDF({ client, rows: rows || [] }, pass)
}
