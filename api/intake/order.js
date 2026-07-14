import { createClient } from '@supabase/supabase-js'
import { applyCors } from '../_cors.js'

// Public order intake. Your website POSTs a purchase here (no payment yet) and
// it: reuses/creates the customer, files an order, draws down stock, and raises
// an invoice — so the sale shows in the app and the customer's portal.
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const formSecret = process.env.CONTACT_FORM_SECRET

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

// Next "PREFIX-N" number, one above the current maximum in `column`.
async function nextNumber(supabase, table, column, prefix, base) {
  const { data } = await supabase.from(table).select(column)
  let max = base - 1
  for (const row of data || []) {
    const m = String(row[column] || '').match(/(\d+)\s*$/)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `${prefix}${max + 1}`
}

export default async function handler(req, res) {
  if (applyCors(req, res, 'POST, OPTIONS')) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!url || !serviceKey) return res.status(500).json({ error: 'Shop not configured (missing Supabase env vars).' })
  if (formSecret && req.headers['x-form-secret'] !== formSecret) return res.status(401).json({ error: 'Unauthorised' })

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  body = body || {}
  if (body._gotcha || body.honeypot) return res.status(200).json({ ok: true }) // bot

  const customer = body.customer || {}
  const name = (customer.name || '').trim()
  const email = (customer.email || '').trim()
  const phone = (customer.phone || '').trim()
  const note = (body.note || '').trim()
  const items = Array.isArray(body.items) ? body.items : []

  if (!name || !email) return res.status(400).json({ error: 'customer name and email are required.' })
  if (!isEmail(email)) return res.status(400).json({ error: 'A valid customer email is required.' })
  if (items.length === 0) return res.status(400).json({ error: 'At least one order item is required.' })

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  try {
    // Resolve each requested item to a product (by id or SKU).
    const { data: products } = await supabase.from('products').select('*')
    const byId = new Map((products || []).map((p) => [p.id, p]))
    const bySku = new Map((products || []).filter((p) => p.sku).map((p) => [String(p.sku).toLowerCase(), p]))

    const lines = []
    const draw = {} // productId -> qty
    for (const it of items) {
      const qty = Math.floor(Number(it.qty || 0))
      if (qty <= 0) return res.status(400).json({ error: 'Each item needs a quantity of at least 1.' })
      const product = it.productId ? byId.get(it.productId) : it.sku ? bySku.get(String(it.sku).toLowerCase()) : null
      if (!product || !product.active) return res.status(400).json({ error: `Unknown or unavailable product: ${it.productId || it.sku}` })
      if (Number(product.stock) < qty) return res.status(409).json({ error: `Not enough stock for ${product.name} (have ${product.stock}, need ${qty}).` })
      lines.push({ product, qty })
      draw[product.id] = (draw[product.id] || 0) + qty
    }
    const total = lines.reduce((s, l) => s + Number(l.product.price) * l.qty, 0)

    // Reuse or create the customer.
    let clientId
    const { data: existing } = await supabase.from('clients').select('id').ilike('email', email).limit(1).maybeSingle()
    if (existing) clientId = existing.id
    else {
      const { data: created, error } = await supabase.from('clients')
        .insert({ name, email, phone, status: 'Lead' }).select('id').single()
      if (error) throw error
      clientId = created.id
    }

    // Order + items.
    const orderNumber = await nextNumber(supabase, 'orders', 'number', 'ORD-', 1001)
    const { data: order, error: oErr } = await supabase.from('orders')
      .insert({ number: orderNumber, client_id: clientId, status: 'New', source: 'website', note: note || null })
      .select('id').single()
    if (oErr) throw oErr
    await supabase.from('order_items').insert(
      lines.map((l) => ({ order_id: order.id, product_id: l.product.id, name: l.product.name, qty: l.qty, unit_price: l.product.price })),
    )

    // Draw down stock.
    for (const [pid, qty] of Object.entries(draw)) {
      const p = byId.get(pid)
      await supabase.from('products').update({ stock: Math.max(0, Number(p.stock) - qty) }).eq('id', pid)
    }

    // Invoice (Awaiting payment) so it shows in the app + portal.
    const due = new Date(); due.setDate(due.getDate() + 14)
    const dueOn = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`
    const invoiceNumber = await nextNumber(supabase, 'invoices', 'number', 'INV-', 1001)
    const { data: invoice, error: iErr } = await supabase.from('invoices')
      .insert({ number: invoiceNumber, client_id: clientId, job_id: null, status: 'Awaiting payment', issued_on: new Date().toISOString().slice(0, 10), due_on: dueOn })
      .select('id').single()
    if (iErr) throw iErr
    await supabase.from('invoice_items').insert(
      lines.map((l) => ({ invoice_id: invoice.id, name: l.product.name, qty: l.qty, unit_price: l.product.price })),
    )
    await supabase.from('orders').update({ invoice_id: invoice.id }).eq('id', order.id)

    return res.status(200).json({ ok: true, orderNumber, invoiceNumber, total })
  } catch (e) {
    console.error('Order intake failed:', e)
    return res.status(500).json({ error: 'Could not place the order. Please try again.' })
  }
}
