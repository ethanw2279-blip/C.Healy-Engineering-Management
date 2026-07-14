import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, Button, StatusBadge, EmptyState } from '../components/ui'
import { useStore, useCurrentUser, eur, orderTotal, formatDate } from '../../data/store'
import OrderModal from '../OrderModal'

const filters = ['All', 'New', 'Processing', 'Fulfilled', 'Cancelled'] as const

export default function ShopOrders() {
  const { state } = useStore()
  const { can } = useCurrentUser()
  const canManage = can('create:records')
  const nav = useNavigate()
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')
  const [creating, setCreating] = useState(false)

  const clientName = (id: string) => state.clients.find((c) => c.id === id)?.name ?? 'Unknown'

  const orders = [...state.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const rows = orders.filter((o) => filter === 'All' || o.status === filter)

  // Sales = everything not cancelled.
  const sales = orders.filter((o) => o.status !== 'Cancelled')
  const salesTotal = sales.reduce((s, o) => s + orderTotal(o), 0)
  const open = orders.filter((o) => o.status === 'New' || o.status === 'Processing').length

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} orders`}
        action={canManage && <Button onClick={() => setCreating(true)}>New order</Button>}
      />

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="stat-card">
          <div className="stat-label">Total sales</div>
          <div className="stat-value">{eur(salesTotal)}</div>
          <div className="stat-meta">{sales.length} orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Open orders</div>
          <div className="stat-value">{open}</div>
          <div className="stat-meta">New or processing</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Fulfilled</div>
          <div className="stat-value">{orders.filter((o) => o.status === 'Fulfilled').length}</div>
        </div>
      </div>

      <div className="toolbar">
        {filters.map((f) => (
          <button key={f} className={`tab-filter ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="card">
        {rows.length === 0 ? (
          <EmptyState title="No orders here" hint={canManage ? 'Create an order, or connect your website to receive them.' : undefined} />
        ) : (
          <table className="table">
            <thead>
              <tr><th>Order</th><th>Client</th><th>Items</th><th>Source</th><th className="num">Total</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="clickable" onClick={() => nav(`/shop/orders/${o.id}`)}>
                  <td className="cell-strong">{o.number}</td>
                  <td>{clientName(o.clientId)}</td>
                  <td className="cell-muted">{o.items.reduce((s, i) => s + i.qty, 0)} item(s)</td>
                  <td><span className="badge badge-grey">{o.source === 'website' ? 'Website' : 'Manual'}</span></td>
                  <td className="num cell-strong">{eur(orderTotal(o))}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="cell-muted">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {creating && <OrderModal onClose={() => setCreating(false)} />}
    </div>
  )
}
