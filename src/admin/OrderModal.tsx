import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Field, Button } from './components/ui'
import { ClientSelect, nextNumber, today } from './formParts'
import { TrashIcon, PlusIcon } from '../components/Icons'
import { useStore, newId, eur, itemsTotal } from '../data/store'
import type { Order, OrderItem, Invoice, Product } from '../data/types'

type Row = { id: string; productId: string; qty: number }

// Creates a shop order: reserves stock and generates an invoice for the client
// (so the purchase shows up in their invoices and the client portal).
export default function OrderModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const [clientId, setClientId] = useState('')
  const [note, setNote] = useState('')
  const [rows, setRows] = useState<Row[]>([{ id: newId('r'), productId: '', qty: 1 }])
  const [makeInvoice, setMakeInvoice] = useState(true)

  const sellable = state.products.filter((p) => p.active)
  const productById = (id: string) => state.products.find((p) => p.id === id)

  const setRow = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const addRow = () => setRows((rs) => [...rs, { id: newId('r'), productId: '', qty: 1 }])
  const removeRow = (id: string) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs))

  const lineItems: OrderItem[] = rows
    .filter((r) => r.productId && r.qty > 0)
    .map((r) => {
      const p = productById(r.productId)!
      return { id: newId('oi'), productId: p.id, name: p.name, qty: r.qty, unitPrice: p.price }
    })
  const total = itemsTotal(lineItems)

  // Warn if any line exceeds available stock.
  const overStock = rows.some((r) => {
    const p = productById(r.productId)
    return p && r.qty > p.stock
  })
  const valid = !!clientId && lineItems.length > 0 && !overStock

  const save = () => {
    if (!valid) return
    const order: Order = {
      id: newId('o'),
      number: nextNumber('ORD-', state.orders.map((o) => o.number)),
      clientId,
      items: lineItems,
      status: 'New',
      source: 'admin',
      note: note || undefined,
      createdAt: new Date().toISOString(),
    }

    // Draw down stock for each ordered product.
    const drawn: Record<string, number> = {}
    for (const it of lineItems) if (it.productId) drawn[it.productId] = (drawn[it.productId] ?? 0) + it.qty
    for (const [pid, qty] of Object.entries(drawn)) {
      const p = productById(pid) as Product
      dispatch({ type: 'UPDATE_PRODUCT', product: { ...p, stock: Math.max(0, p.stock - qty) } })
    }

    // Generate an invoice so the purchase appears in the client's invoices/portal.
    if (makeInvoice) {
      const due = new Date()
      due.setDate(due.getDate() + 14)
      const invoice: Invoice = {
        id: newId('i'),
        number: nextNumber('INV-', state.invoices.map((i) => i.number)),
        clientId,
        items: lineItems.map((it) => ({ id: newId('li'), name: it.name, qty: it.qty, unitPrice: it.unitPrice })),
        status: 'Awaiting payment',
        issuedOn: today(),
        dueOn: `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`,
      }
      order.invoiceId = invoice.id
      dispatch({ type: 'ADD_INVOICE', invoice })
    }

    dispatch({ type: 'ADD_ORDER', order })
    onClose()
    nav(`/shop/orders/${order.id}`)
  }

  return (
    <Modal
      title="New order"
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!valid}>Create order</Button>
        </>
      }
    >
      <ClientSelect value={clientId} onChange={setClientId} />

      <div className="field-label" style={{ marginTop: 6 }}>Items</div>
      {rows.map((r) => {
        const p = productById(r.productId)
        const over = p && r.qty > p.stock
        return (
          <div key={r.id} className="order-line">
            <select value={r.productId} onChange={(e) => setRow(r.id, { productId: e.target.value })}>
              <option value="">Select a product…</option>
              {sellable.map((prod) => (
                <option key={prod.id} value={prod.id}>{prod.name} — {eur(prod.price)} ({prod.stock} in stock)</option>
              ))}
            </select>
            <input type="number" min={1} value={r.qty} onChange={(e) => setRow(r.id, { qty: Number(e.target.value) })} className={over ? 'input-error' : ''} />
            <span className="order-line-total">{p ? eur(p.price * r.qty) : '—'}</span>
            <button className="row-remove" aria-label="Remove line" onClick={() => removeRow(r.id)}><TrashIcon size={16} /></button>
          </div>
        )
      })}
      <button className="link-btn" onClick={addRow}><PlusIcon size={14} /> Add item</button>

      {overStock && <p className="form-hint" style={{ color: 'var(--red)' }}>One or more lines exceed the stock on hand.</p>}

      <div className="order-total-row"><span>Order total</span><strong>{eur(total)}</strong></div>

      <Field label="Note (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything to record about this order" /></Field>
      <label className="fld-check" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={makeInvoice} onChange={(e) => setMakeInvoice(e.target.checked)} />
        Create an invoice for this order (shows in the client’s portal)
      </label>
    </Modal>
  )
}
