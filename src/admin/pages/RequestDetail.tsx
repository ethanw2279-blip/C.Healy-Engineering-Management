import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button, StatusBadge, Avatar, EmptyState } from '../components/ui'
import RequestModal from '../RequestModal'
import { nextNumber, today } from '../formParts'
import { useStore, useCurrentUser, newId, formatDate } from '../../data/store'
import type { Quote } from '../../data/types'

export default function RequestDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { state, dispatch } = useStore()
  const { can } = useCurrentUser()
  const [editing, setEditing] = useState(false)

  const request = state.requests.find((r) => r.id === id)
  if (!request) {
    return (
      <div>
        <Link className="back-link" to="/requests">← Requests</Link>
        <div className="card"><EmptyState title="Request not found" hint="It may have been removed." /></div>
      </div>
    )
  }

  const canManage = can('create:records')
  const client = state.clients.find((c) => c.id === request.clientId)

  const remove = () => {
    if (confirm('Remove this request? This can\'t be undone.')) {
      dispatch({ type: 'REMOVE_REQUEST', id: request.id })
      nav('/requests')
    }
  }

  // Request → Quote: create a draft quote for the same client and mark the
  // request converted.
  const convertToQuote = () => {
    const quote: Quote = {
      id: newId('q'),
      number: nextNumber('Q-', state.quotes.map((q) => q.number)),
      clientId: request.clientId,
      title: request.title,
      items: [{ id: newId('li'), name: request.service || request.title, qty: 1, unitPrice: 0 }],
      status: 'Draft',
      createdAt: today(),
    }
    dispatch({ type: 'ADD_QUOTE', quote })
    dispatch({ type: 'UPDATE_REQUEST', request: { ...request, status: 'Converted' } })
    nav(`/quotes/${quote.id}`)
  }

  return (
    <div>
      <Link className="back-link" to="/requests">← Requests</Link>

      <div className="detail-head">
        <div className="detail-id">
          <div>
            <h1 className="detail-name">{request.title}</h1>
            <div className="detail-sub">
              {client && <Link className="link" to={`/clients/${client.id}`}>{client.name}</Link>}
              <StatusBadge status={request.status} />
            </div>
          </div>
        </div>
        {canManage && (
          <div className="detail-actions">
            {request.status !== 'Converted' && <Button onClick={convertToQuote}>Convert to quote</Button>}
            <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="danger" onClick={remove}>Remove</Button>
          </div>
        )}
      </div>

      <div className="card contact-card" style={{ maxWidth: 520 }}>
        <div className="contact-row"><span>Client</span><strong>{client?.name ?? '—'}</strong></div>
        <div className="contact-row"><span>Service</span><strong>{request.service || '—'}</strong></div>
        <div className="contact-row"><span>Requested on</span><strong>{formatDate(request.requestedOn)}</strong></div>
        <div className="contact-row"><span>Status</span><strong><StatusBadge status={request.status} /></strong></div>
      </div>

      {client && (
        <div className="detail-section">
          <div className="detail-section-title">Client</div>
          <div className="card">
            <Link className="agenda-row" to={`/clients/${client.id}`} style={{ textDecoration: 'none' }}>
              <Avatar name={client.name} size={34} />
              <div className="agenda-body">
                <strong>{client.name}</strong>
                <span>{client.email} · {client.phone}</span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {editing && <RequestModal editing={request} onClose={() => setEditing(false)} />}
    </div>
  )
}
