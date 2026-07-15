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
    .select('id, name, sku, description, price, stock, slug, category, subcategory, short, tag, images, specs')
    .eq('active', true)
    .order('category')
  if (error) return res.status(500).json({ error: error.message })

  // Shaped to match what the website shop expects (title/id-slug/specs/etc.),
  // so the storefront renders straight from the app's catalogue.
  const products = (data || []).map((p) => {
    const stock = Number(p.stock || 0)
    return {
      id: p.slug || p.id, // the website uses the slug as the product URL id
      productId: p.id, // the real id, for placing orders
      sku: p.sku || '',
      title: p.name,
      short: p.short || '',
      description: p.description || '',
      price: Number(p.price || 0),
      category: p.category || '',
      subcategory: p.subcategory || '',
      tag: p.tag || '',
      images: Array.isArray(p.images) ? p.images : [],
      specs: Array.isArray(p.specs) ? p.specs : [],
      stock,
      inStock: stock > 0,
    }
  })
  return res.status(200).json({ products })
}
