import { useState } from 'react'
import { usePortal } from '../PortalData'
import { eur, formatDate } from '../../data/store'
import { placeOrder } from '../actions'

export default function Shop() {
  const { data, refresh } = usePortal()
  const [cart, setCart] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [placed, setPlaced] = useState<string | null>(null)

  const qty = (id: string) => cart[id] || 0
  const setQty = (id: string, n: number, max: number) => setCart((c) => ({ ...c, [id]: Math.max(0, Math.min(max, n)) }))

  const cartItems = data.products.filter((p) => qty(p.id) > 0)
  const cartCount = cartItems.reduce((s, p) => s + qty(p.id), 0)
  const cartTotal = cartItems.reduce((s, p) => s + qty(p.id) * p.price, 0)

  const checkout = async () => {
    setError(null); setBusy(true)
    try {
      const { orderNumber } = await placeOrder(cartItems.map((p) => ({ productId: p.id, qty: qty(p.id) })))
      setPlaced(orderNumber)
      setCart({})
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not place the order.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 32, margin: '0 0 4px' }}>Parts &amp; orders</h1>
          <p style={{ fontSize: 14, color: 'var(--color-neutral-700)', margin: 0 }}>Reorder consumables and lifting gear. Delivered with your next visit, or couriered.</p>
        </div>
        <div className="blueprint" style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 12.5, color: 'var(--color-neutral-700)' }}>{cartCount} item{cartCount === 1 ? '' : 's'}</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 19 }}>{eur(cartTotal)}</span>
          <button className="btn btn-primary" onClick={checkout} disabled={cartCount === 0 || busy}>{busy ? 'Placing…' : 'Checkout'}</button>
        </div>
      </div>

      {error && <div className="pt-callout" style={{ marginBottom: 16 }}>{error}</div>}
      {placed && <div className="pt-callout" style={{ marginBottom: 16 }}>Order {placed} placed — we'll be in touch to arrange delivery.</div>}

      {data.products.length === 0 ? (
        <p style={{ color: 'var(--color-neutral-700)' }}>No products available right now.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 18, marginBottom: 34 }}>
          {data.products.map((p) => (
            <div key={p.id} className="blueprint" style={{ padding: '13px 15px 15px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {p.sku && <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-accent-700)' }}>{p.sku}</div>}
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 17, lineHeight: 1.2 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-neutral-700)', flex: 1 }}>{p.description}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 6 }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 20 }}>{eur(p.price)}</span>
                <span style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <button className="btn btn-secondary btn-icon" onClick={() => setQty(p.id, qty(p.id) - 1, p.stock)} disabled={qty(p.id) === 0}>−</button>
                <span style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 16 }}>{qty(p.id)}</span>
                <button className="btn btn-secondary btn-icon" onClick={() => setQty(p.id, qty(p.id) + 1, p.stock)} disabled={qty(p.id) >= p.stock}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.orders.length > 0 && (
        <>
          <h2 style={{ fontSize: 22, margin: '0 0 12px' }}>Order history</h2>
          <div style={{ borderTop: '1px solid var(--color-divider)' }}>
            {data.orders.map((o) => (
              <div key={o.id} className="prow" style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '14px 12px', borderBottom: '1px solid var(--color-divider)', flexWrap: 'wrap' }}>
                <span style={{ width: 88, flex: 'none', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14 }}>{o.number}</span>
                <span style={{ flex: 1, minWidth: 180 }}>
                  <span style={{ display: 'block', fontSize: 14 }}>{o.items.map((it) => `${it.qty}× ${it.name}`).join(', ') || '—'}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--color-neutral-700)', marginTop: 1 }}>{formatDate(o.createdAt)}</span>
                </span>
                <span className="tag tag-neutral">{o.status}</span>
                <span style={{ width: 70, textAlign: 'right', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 17 }}>{eur(o.total)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
