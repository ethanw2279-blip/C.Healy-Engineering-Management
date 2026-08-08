import { PassThrough } from 'stream'
import { createClient } from '@supabase/supabase-js'
import { generateGA1PDF } from '../_ga1pdf.js'
import { makeZip } from '../_zip.js'

// Bundles several GA1 certificates into one .zip. Auth: staff (an employee
// login) may zip any client's reports; a client login is limited to its own.
// Called with ?ids=id1,id2,… (fetched with a bearer token, downloaded as blob).
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

const MAX_REPORTS = 200

// Render one inspection to a PDF Buffer using the shared generator.
function renderPDF(payload) {
  return new Promise((resolve, reject) => {
    const chunks = []
    const pass = new PassThrough()
    pass.on('data', (c) => chunks.push(c))
    pass.on('end', () => resolve(Buffer.concat(chunks)))
    pass.on('error', reject)
    try { generateGA1PDF(payload, pass) } catch (e) { reject(e) }
  })
}

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

  const ids = String(req.query.ids || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, MAX_REPORTS)
  if (ids.length === 0) return res.status(400).json({ error: 'No reports selected.' })

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  const [{ data: emp }, { data: ownClient }, { data: membership }] = await Promise.all([
    admin.from('employees').select('id').eq('auth_user_id', uid).maybeSingle(),
    admin.from('clients').select('id').eq('auth_user_id', uid).maybeSingle(),
    admin.from('client_users').select('client_id').eq('auth_user_id', uid).maybeSingle().then((r) => r).catch(() => ({ data: null })),
  ])
  const callerClientId = ownClient?.id || membership?.client_id

  const { data: reports } = await admin.from('ga1_inspections').select('*').in('id', ids)
  if (!reports || reports.length === 0) return res.status(404).json({ error: 'No reports found.' })

  // Authorisation: staff → any; client → only their own reports.
  if (!emp) {
    if (!callerClientId) return res.status(403).json({ error: 'Not authorised.' })
    if (reports.some((g) => g.client_id !== callerClientId)) return res.status(403).json({ error: 'Some reports are not on your account.' })
  }

  // Batch-load the clients + examiners referenced by these reports.
  const clientIds = [...new Set(reports.map((g) => g.client_id).filter(Boolean))]
  const examinerIds = [...new Set(reports.map((g) => g.examiner_id).filter(Boolean))]
  const [{ data: clients }, { data: examiners }] = await Promise.all([
    clientIds.length ? admin.from('clients').select('id, name, company, email, phone').in('id', clientIds) : Promise.resolve({ data: [] }),
    examinerIds.length ? admin.from('employees').select('id, name').in('id', examinerIds) : Promise.resolve({ data: [] }),
  ])
  const clientById = new Map((clients || []).map((c) => [c.id, c]))
  const examinerById = new Map((examiners || []).map((e) => [e.id, e]))

  try {
    const used = new Set()
    const files = []
    for (const g of reports) {
      const examiner = examinerById.get(g.examiner_id)
      const client = clientById.get(g.client_id)
      const inspection = {
        ...g,
        engineer_name: examiner?.name || '',
        inspection_results: JSON.stringify({ defects_found: g.defects_found, safe_to_use: g.safe_to_use }),
      }
      const pdf = await renderPDF({
        inspection,
        client: client ? { name: client.name, company: client.company, email: client.email, phone: client.phone } : {},
        engineer: { name: examiner?.name },
      })
      // Unique, filesystem-safe name per report.
      let base = String(g.report_number || g.id).replace(/[^a-z0-9._-]+/gi, '-')
      let name = `${base}.pdf`
      let n = 2
      while (used.has(name)) name = `${base}-${n++}.pdf`
      used.add(name)
      files.push({ name, data: pdf })
    }

    const zip = makeZip(files)
    const clientName = clientById.get(reports[0].client_id)
    const safe = String(clientName?.company || clientName?.name || 'client').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="GA1-Reports-${safe || 'client'}.zip"`)
    res.setHeader('Content-Length', zip.length)
    return res.end(zip)
  } catch (e) {
    console.error('GA1 zip failed:', e)
    if (!res.headersSent) return res.status(500).json({ error: 'Could not build the zip.' })
  }
}
