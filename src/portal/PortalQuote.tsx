import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePortal } from './PortalData'
import { eur, eurExact, quoteTotal, formatDate } from '../data/store'

export default function PortalQuote() {
  const { id } = useParams()
  const nav = useNavigate()
  const { data, approveQuote } = usePortal()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const quote = data.quotes.find((q) => q.id === id)
  if (!quote) {
    return (
      <div className="portal-page">
        <button className="portal-back" onClick={() => nav('/portal')}>← Back</button>
        <p className="portal-muted">Quote not found.</p>
      </div>
    )
  }

  const approve = async () => {
    setBusy(true)
    setError(null)
    try {
      await approveQuote(quote.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not approve the quote.')
    } finally {
      setBusy(false)
    }
  }

  const canApprove = quote.status === 'Awaiting response'

  return (
    <div className="portal-page">
      <button className="portal-back" onClick={() => nav('/portal')}>← Back</button>

      <div className="portal-doc-head">
        <div>
          <h1 className="portal-h1">{quote.title}</h1>
          <p className="portal-sub">Quote {quote.number} · {formatDate(quote.createdAt)}</p>
        </div>
        <span className={`badge badge-${quote.status === 'Awaiting response' ? 'amber' : 'green'}`}>{quote.status}</span>
      </div>

      <div className="portal-table">
        <div className="portal-tr portal-th">
          <span>Item</span><span className="num">Qty</span><span className="num">Price</span><span className="num">Total</span>
        </div>
        {quote.items.map((it) => (
          <div key={it.id} className="portal-tr">
            <span>{it.name}</span>
            <span className="num">{it.qty}</span>
            <span className="num">{eurExact(it.unitPrice)}</span>
            <span className="num">{eurExact(it.qty * it.unitPrice)}</span>
          </div>
        ))}
        <div className="portal-tr portal-total">
          <span>Total</span><span /><span /><span className="num">{eur(quoteTotal(quote))}</span>
        </div>
      </div>

      {error && <div className="portal-error">{error}</div>}

      {canApprove ? (
        <button className="portal-btn" onClick={approve} disabled={busy}>
          {busy ? 'Approving…' : 'Approve this quote'}
        </button>
      ) : quote.status === 'Approved' || quote.status === 'Converted' ? (
        <div className="portal-approved">✓ You approved this quote. We'll be in touch to schedule the work.</div>
      ) : null}
    </div>
  )
}
