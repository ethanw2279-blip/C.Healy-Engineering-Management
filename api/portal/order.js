import { createClient } from '@supabase/supabase-js'

// Authenticated portal order. The signed-in client posts cart items; we file an
// order against their own client record, draw down stock, and raise it in the
// app (source 'website'). Service-role after verifying the caller owns the
// client (RLS lets a client read products/orders but not write orders).
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

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
    admin.from('clients').select('id').eq('auth_user_id', userData.user.id).maybeSingle(),
    admin.from('client_users').select('client_id').eq('auth_user_id', userData.user.id).maybeSingle(),
  ])
  const clientId = ownClient?.id || membership?.client_id
  if (!clientId) return res.status(403).json({ error: 'No client record linked to this login.' })

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  const items = Array.isArray((body || {}).items) ? body.items : []
  if (items.length === 0) return res.status(400).json({ error: 'Your basket is empty.' })

  try {
    const { data: products } = await admin.from('products').select('*')
    const byId = new Map((products || []).map((p) => [p.id, p]))

    const lines = []
    const draw = {}
    for (const it of items) {
      const qty = Math.floor(Number(it.qty || 0))
      if (qty <= 0) continue
      const product = byId.get(it.productId)
      if (!product || !product.active) return res.status(400).json({ error: 'One of the items is no longer available.' })
      if (Number(product.stock) < qty) return res.status(409).json({ error: `Not enough stock for ${product.name} (have ${product.stock}).` })
      lines.push({ product, qty })
      draw[product.id] = (draw[product.id] || 0) + qty
    }
    if (lines.length === 0) return res.status(400).json({ error: 'Your basket is empty.' })

    const orderNumber = await nextNumber(admin, 'orders', 'number', 'ORD-', 1001)
    const { data: order, error: oErr } = await admin.from('orders')
      .insert({ number: orderNumber, client_id: clientId, status: 'New', source: 'website' })
      .select('id').single()
    if (oErr) throw oErr
    await admin.from('order_items').insert(
      lines.map((l) => ({ order_id: order.id, product_id: l.product.id, name: l.product.name, qty: l.qty, unit_price: l.product.price })),
    )
    for (const [pid, qty] of Object.entries(draw)) {
      const p = byId.get(pid)
      await admin.from('products').update({ stock: Math.max(0, Number(p.stock) - qty) }).eq('id', pid)
    }

    const total = lines.reduce((s, l) => s + Number(l.product.price) * l.qty, 0)
    return res.status(200).json({ ok: true, orderNumber, total })
  } catch (e) {
    console.error('Portal order failed:', e)
    return res.status(500).json({ error: 'Could not place the order. Please try again.' })
  }
}
