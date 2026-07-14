import { createClient } from '@supabase/supabase-js'
import { applyCors } from '../_cors.js'

// Public product catalogue for the website shop. Returns active products with
// live stock so the site can render what's for sale.
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  if (applyCors(req, res, 'GET, OPTIONS')) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!url || !serviceKey) return res.status(500).json({ error: 'Shop not configured.' })

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, description, price, stock')
    .eq('active', true)
    .order('name')
  if (error) return res.status(500).json({ error: error.message })

  const products = (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku || '',
    description: p.description || '',
    price: Number(p.price || 0),
    stock: Number(p.stock || 0),
    inStock: Number(p.stock || 0) > 0,
  }))
  return res.status(200).json({ products })
}
