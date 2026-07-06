import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button, StatusBadge, EmptyState } from '../components/ui'
import InvoiceModal from '../InvoiceModal'
import { useStore, useCurrentUser, eur, eurExact, invoiceTotal, formatDate } from '../../data/store'

export default function InvoiceDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { state, dispatch } = useStore()
  const { can } = useCurrentUser()
  const [editing, setEditing] = useState(false)

  const invoice = state.invoices.find((i) => i.id === id)
  if (!invoice) {
    return (
      <div>
        <Link className="back-link" to="/invoices">← Invoices</Link>
        <div className="card"><EmptyState title="Invoice not found" hint="It may have been removed." /></div>
      </div>
    )
  }

  const canManage = can('create:records')
  const client = state.clients.find((c) => c.id === invoice.clientId)
  const job = state.jobs.find((j) => j.id === invoice.jobId)

  const remove = () => {
    if (confirm(`Remove ${invoice.number}? This can't be undone.`)) {
      dispatch({ type: 'REMOVE_INVOICE', id: invoice.id })
      nav('/invoices')
    }
  }
  const markPaid = () => dispatch({ type: 'UPDATE_INVOICE', invoice: { ...invoice, status: 'Paid' } })

  return (
    <div>
      <Link className="back-link" to="/invoices">← Invoices</Link>

      <div className="detail-head">
        <div className="detail-id">
          <div>
            <h1 className="detail-name">{invoice.number}</h1>
            <div className="detail-sub">
              {client && <Link className="link" to={`/clients/${client.id}`}>{client.name}</Link>}
              <StatusBadge status={invoice.status} />
            </div>
          </div>
        </div>
        {canManage && (
          <div className="detail-actions">
            {invoice.status !== 'Paid' && <Button onClick={markPaid}>Mark as paid</Button>}
            <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="danger" onClick={remove}>Remove</Button>
          </div>
        )}
      </div>

      <div className="detail-grid">
        <div className="card contact-card">
          <div className="contact-row"><span>Client</span><strong>{client?.name ?? '—'}</strong></div>
          <div className="contact-row"><span>Issued</span><strong>{formatDate(invoice.issuedOn)}</strong></div>
          <div className="contact-row"><span>Due</span><strong>{formatDate(invoice.dueOn)}</strong></div>
          <div className="contact-row">
            <span>From job</span>
            <strong>{job ? <Link className="link" to={`/jobs/${job.id}`}>{job.number}</Link> : '—'}</strong>
          </div>
        </div>
        <div className="stat-grid detail-stats">
          <div className="stat-card">
            <div className="stat-label">Amount</div>
            <div className="stat-value">{eur(invoiceTotal(invoice))}</div>
            <div className="stat-meta">{invoice.status}</div>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">Line items</div>
        <div className="card">
          <table className="table">
            <thead><tr><th>Product / service</th><th className="num">Qty</th><th className="num">Unit</th><th className="num">Total</th></tr></thead>
            <tbody>
              {invoice.items.length === 0 && <tr><td colSpan={4} className="cell-muted">No line items.</td></tr>}
              {invoice.items.map((it) => (
                <tr key={it.id}>
                  <td className="cell-strong">{it.name}</td>
                  <td className="num">{it.qty}</td>
                  <td className="num">{eurExact(it.unitPrice)}</td>
                  <td className="num cell-strong">{eurExact(it.qty * it.unitPrice)}</td>
                </tr>
              ))}
              <tr><td colSpan={3} className="num cell-strong">Total</td><td className="num cell-strong">{eur(invoiceTotal(invoice))}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {editing && <InvoiceModal editing={invoice} onClose={() => setEditing(false)} />}
    </div>
  )
}
