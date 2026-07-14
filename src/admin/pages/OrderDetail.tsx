import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button, StatusBadge, EmptyState } from '../components/ui'
import { nextNumber, today } from '../formParts'
import { useStore, useCurrentUser, newId, eur, eurExact, orderTotal, formatDate } from '../../data/store'
import type { Invoice, OrderStatus, Product } from '../../data/types'

const NEXT: Record<OrderStatus, OrderStatus | null> = {
  New: 'Processing', Processing: 'Fulfilled', Fulfilled: null, Cancelled: null,
}

export default function OrderDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { state, dispatch } = useStore()
  const { can } = useCurrentUser()
  const canManage = can('create:records')

  const order = state.orders.find((o) => o.id === id)
  if (!order) {
    return (
      <div>
        <Link className="back-link" to="/shop/orders">← Orders</Link>
        <div className="card"><EmptyState title="Order not found" hint="It may have been removed." /></div>
      </div>
    )
  }

  const client = state.clients.find((c) => c.id === order.clientId)
  const invoice = state.invoices.find((i) => i.id === order.invoiceId)
  const total = orderTotal(order)

  const setStatus = (status: OrderStatus) => {
    // Cancelling an active order returns its stock to the shelf.
    if (status === 'Cancelled' && order.status !== 'Cancelled') {
      const back: Record<string, number> = {}
      for (const it of order.items) if (it.productId) back[it.productId] = (back[it.productId] ?? 0) + it.qty
      for (const [pid, qty] of Object.entries(back)) {
        const p = state.products.find((x) => x.id === pid)
        if (p) dispatch({ type: 'UPDATE_PRODUCT', product: { ...p, stock: p.stock + qty } as Product })
      }
    }
    dispatch({ type: 'UPDATE_ORDER', order: { ...order, status } })
  }

  const createInvoice = () => {
    const due = new Date()
    due.setDate(due.getDate() + 14)
    const inv: Invoice = {
      id: newId('i'),
      number: nextNumber('INV-', state.invoices.map((i) => i.number)),
      clientId: order.clientId,
      items: order.items.map((it) => ({ id: newId('li'), name: it.name, qty: it.qty, unitPrice: it.unitPrice })),
      status: 'Awaiting payment',
      issuedOn: today(),
      dueOn: `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`,
    }
    dispatch({ type: 'ADD_INVOICE', invoice: inv })
    dispatch({ type: 'UPDATE_ORDER', order: { ...order, invoiceId: inv.id } })
    nav(`/invoices/${inv.id}`)
  }

  const remove = () => {
    if (confirm(`Remove ${order.number}? This does not restore stock.`)) {
      dispatch({ type: 'REMOVE_ORDER', id: order.id })
      nav('/shop/orders')
    }
  }

  const next = NEXT[order.status]

  return (
    <div>
      <Link className="back-link" to="/shop/orders">← Orders</Link>

      <div className="detail-head">
        <div className="detail-id">
          <div>
            <h1 className="detail-name">{order.number}</h1>
            <div className="detail-sub">
              {client && <Link className="link" to={`/clients/${client.id}`}>{client.name}</Link>}
              <StatusBadge status={order.status} />
              <span className="badge badge-grey">{order.source === 'website' ? 'Website' : 'Manual'}</span>
            </div>
          </div>
        </div>
        {canManage && (
          <div className="detail-actions">
            {next && <Button onClick={() => setStatus(next)}>Mark {next}</Button>}
            {order.status !== 'Cancelled' && order.status !== 'Fulfilled' && (
              <Button variant="secondary" onClick={() => setStatus('Cancelled')}>Cancel order</Button>
            )}
            <Button variant="danger" onClick={remove}>Remove</Button>
          </div>
        )}
      </div>

      <div className="detail-grid">
        <div className="card contact-card">
          <div className="contact-row"><span>Client</span><strong>{client?.name ?? '—'}</strong></div>
          <div className="contact-row"><span>Email</span><strong>{client?.email ?? '—'}</strong></div>
          <div className="contact-row"><span>Placed</span><strong>{formatDate(order.createdAt)}</strong></div>
          <div className="contact-row"><span>Invoice</span><strong>
            {invoice ? <Link className="link" to={`/invoices/${invoice.id}`}>{invoice.number}</Link>
              : canManage ? <button className="link-btn" onClick={createInvoice}>Create invoice</button>
              : '—'}
          </strong></div>
        </div>

        <div className="stat-grid detail-stats">
          <div className="stat-card">
            <div className="stat-label">Order total</div>
            <div className="stat-value">{eur(total)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Items</div>
            <div className="stat-value">{order.items.reduce((s, i) => s + i.qty, 0)}</div>
          </div>
        </div>
      </div>

      {order.note && (
        <div className="detail-section">
          <div className="detail-section-title"><span>Note</span></div>
          <div className="card"><p style={{ margin: 0 }}>{order.note}</p></div>
        </div>
      )}

      <div className="detail-section">
        <div className="detail-section-title"><span>Items</span></div>
        <div className="card">
          <table className="table">
            <thead><tr><th>Product</th><th className="num">Qty</th><th className="num">Unit</th><th className="num">Total</th></tr></thead>
            <tbody>
              {order.items.map((it) => (
                <tr key={it.id}>
                  <td className="cell-strong">{it.name}</td>
                  <td className="num">{it.qty}</td>
                  <td className="num">{eurExact(it.unitPrice)}</td>
                  <td className="num cell-strong">{eurExact(it.qty * it.unitPrice)}</td>
                </tr>
              ))}
              <tr><td colSpan={3} className="num cell-strong">Total</td><td className="num cell-strong">{eur(total)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
