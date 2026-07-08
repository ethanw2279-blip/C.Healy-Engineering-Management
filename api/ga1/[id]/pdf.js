import { PassThrough } from 'stream'
import { createClient } from '@supabase/supabase-js'
import { generateGA1PDF } from '../../_ga1pdf.js'

// Server-only Supabase client. Uses the service-role key (never exposed to the
// browser) so it can read the inspection regardless of row-level security.
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  if (!url || !serviceKey) {
    return res.status(500).json({
      error: 'PDF service not configured. Set SUPABASE_SERVICE_ROLE_KEY (and VITE_SUPABASE_URL) in Vercel.',
    })
  }

  const { id } = req.query
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data: g, error } = await supabase.from('ga1_inspections').select('*').eq('id', id).single()
  if (error || !g) return res.status(404).json({ error: 'Inspection not found' })

  const [{ data: client }, { data: examiner }] = await Promise.all([
    g.client_id ? supabase.from('clients').select('name, company, email, phone').eq('id', g.client_id).single() : Promise.resolve({ data: null }),
    g.examiner_id ? supabase.from('employees').select('name').eq('id', g.examiner_id).single() : Promise.resolve({ data: null }),
  ])

  // The generator expects a joined `inspection_results` JSON blob; our schema
  // stores those as boolean columns, so synthesise it here.
  const inspection = {
    ...g,
    engineer_name: examiner?.name || '',
    inspection_results: JSON.stringify({ defects_found: g.defects_found, safe_to_use: g.safe_to_use }),
  }

  const chunks = []
  const pass = new PassThrough()
  pass.on('data', (chunk) => chunks.push(chunk))
  pass.on('end', () => {
    const pdf = Buffer.concat(chunks)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${g.report_number || 'GA1'}.pdf"`)
    res.setHeader('Content-Length', pdf.length)
    res.end(pdf)
  })
  pass.on('error', (err) => {
    console.error('PDF error:', err)
    if (!res.headersSent) res.status(500).json({ error: 'PDF generation failed' })
  })

  generateGA1PDF(
    {
      inspection,
      client: client ? { name: client.name, company: client.company, email: client.email, phone: client.phone } : {},
      engineer: { name: examiner?.name },
    },
    pass,
  )
}
