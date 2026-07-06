import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button, StatusBadge, EmptyState } from '../components/ui'
import QuoteModal from '../QuoteModal'
import { nextNumber } from '../formParts'
import { useStore, useCurrentUser, newId, eur, eurExact, quoteTotal, formatDate } from '../../data/store'
import type { Job } from '../../data/types'

export default function QuoteDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { state, dispatch } = useStore()
  const { can } = useCurrentUser()
  const [editing, setEditing] = useState(false)

  const quote = state.quotes.find((q) => q.id === id)
  if (!quote) {
    return (
      <div>
        <Link className="back-link" to="/quotes">← Quotes</Link>
        <div className="card"><EmptyState title="Quote not found" hint="It may have been removed." /></div>
      </div>
    )
  }

  const canManage = can('create:records')
  const client = state.clients.find((c) => c.id === quote.clientId)

  const remove = () => {
    if (confirm(`Remove ${quote.number}? This can't be undone.`)) {
      dispatch({ type: 'REMOVE_QUOTE', id: quote.id })
      nav('/quotes')
    }
  }

  const markApproved = () => dispatch({ type: 'UPDATE_QUOTE', quote: { ...quote, status: 'Approved' } })

  // Quote → Job: copy the line items into a new unscheduled job and mark the
  // quote converted.
  const convertToJob = () => {
    const job: Job = {
      id: newId('j'),
      number: nextNumber('J-', state.jobs.map((j) => j.number)),
      clientId: quote.clientId,
      title: quote.title,
      items: quote.items.map((it) => ({ ...it, id: newId('li') })),
      assignedTo: [],
      status: 'Unscheduled',
      startDate: '',
      endDate: '',
    }
    dispatch({ type: 'ADD_JOB', job })
    dispatch({ type: 'UPDATE_QUOTE', quote: { ...quote, status: 'Converted' } })
    nav(`/jobs/${job.id}`)
  }

  return (
    <div>
      <Link className="back-link" to="/quotes">← Quotes</Link>

      <div className="detail-head">
        <div className="detail-id">
          <div>
            <h1 className="detail-name">{quote.number} · {quote.title}</h1>
            <div className="detail-sub">
              {client && <Link className="link" to={`/clients/${client.id}`}>{client.name}</Link>}
              <StatusBadge status={quote.status} />
            </div>
          </div>
        </div>
        {canManage && (
          <div className="detail-actions">
            {quote.status !== 'Approved' && quote.status !== 'Converted' && (
              <Button variant="secondary" onClick={markApproved}>Mark approved</Button>
            )}
            {quote.status !== 'Converted' && <Button onClick={convertToJob}>Convert to job</Button>}
            <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="danger" onClick={remove}>Remove</Button>
          </div>
        )}
      </div>

      <div className="detail-grid">
        <div className="card contact-card">
          <div className="contact-row"><span>Client</span><strong>{client?.name ?? '—'}</strong></div>
          <div className="contact-row"><span>Created</span><strong>{formatDate(quote.createdAt)}</strong></div>
          <div className="contact-row"><span>Status</span><strong><StatusBadge status={quote.status} /></strong></div>
          <div className="contact-row"><span>Total</span><strong>{eur(quoteTotal(quote))}</strong></div>
        </div>
        <div className="stat-grid detail-stats">
          <div className="stat-card">
            <div className="stat-label">Quote total</div>
            <div className="stat-value">{eur(quoteTotal(quote))}</div>
            <div className="stat-meta">{quote.items.length} line item{quote.items.length === 1 ? '' : 's'}</div>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">Line items</div>
        <div className="card">
          <table className="table">
            <thead><tr><th>Product / service</th><th className="num">Qty</th><th className="num">Unit</th><th className="num">Total</th></tr></thead>
            <tbody>
              {quote.items.length === 0 && <tr><td colSpan={4} className="cell-muted">No line items.</td></tr>}
              {quote.items.map((it) => (
                <tr key={it.id}>
                  <td className="cell-strong">{it.name}</td>
                  <td className="num">{it.qty}</td>
                  <td className="num">{eurExact(it.unitPrice)}</td>
                  <td className="num cell-strong">{eurExact(it.qty * it.unitPrice)}</td>
                </tr>
              ))}
              <tr><td colSpan={3} className="num cell-strong">Total</td><td className="num cell-strong">{eur(quoteTotal(quote))}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {editing && <QuoteModal editing={quote} onClose={() => setEditing(false)} />}
    </div>
  )
}
