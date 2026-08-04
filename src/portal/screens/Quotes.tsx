import { useState } from 'react'
import { usePortal } from '../PortalData'
import { usePortalNav } from '../PortalNav'
import { eur, quoteTotal, formatDate } from '../../data/store'
import { IconCheck } from '../icons'

const toneFor = (status: string) =>
  status === 'Awaiting response' ? 'tag-outline' : status === 'Approved' || status === 'Converted' ? 'tag-accent' : 'tag-neutral'

export function Quotes() {
  const { data } = usePortal()
  const { go } = usePortalNav()
  const quotes = data.quotes

  return (
    <>
      <h1 style={{ fontSize: 32, margin: '0 0 4px' }}>Quotes</h1>
      <p style={{ fontSize: 14, color: 'var(--color-neutral-700)', margin: '0 0 20px' }}>Approve, decline or ask a question. Nothing is scheduled until you say yes.</p>
      {quotes.length === 0 ? (
        <p style={{ color: 'var(--color-neutral-700)' }}>No quotes yet.</p>
      ) : (
        <div style={{ borderTop: '1px solid var(--color-divider)' }}>
          {quotes.map((q) => (
            <button key={q.id} className="prow" onClick={() => go('quote', q.id)} style={{ display: 'flex', alignItems: 'center', gap: 18, width: '100%', textAlign: 'left', padding: '16px 12px', border: 'none', borderBottom: '1px solid var(--color-divider)', background: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer', flexWrap: 'wrap' }}>
              <span style={{ width: 74, flex: 'none', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14 }}>{q.number}</span>
              <span style={{ flex: 1, minWidth: 170 }}>
                <span style={{ display: 'block', fontSize: 15.5, fontWeight: 500 }}>{q.title}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--color-neutral-700)', marginTop: 1 }}>{formatDate(q.createdAt)} · {q.items.length} item{q.items.length === 1 ? '' : 's'}</span>
              </span>
              <span className={`tag ${toneFor(q.status)}`}>{q.status}</span>
              <span style={{ width: 82, textAlign: 'right', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 19 }}>{eur(quoteTotal(q))}</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}

export function QuoteDetail() {
  const { data, approveQuote } = usePortal()
  const { id, go } = usePortalNav()
  const q = data.quotes.find((x) => x.id === id)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!q) return <button className="btn btn-ghost" onClick={() => go('quotes')}>← All quotes</button>

  const approve = async () => {
    setError(null); setBusy(true)
    try { await approveQuote(q.id) } catch (e) { setError(e instanceof Error ? e.message : 'Could not approve.') } finally { setBusy(false) }
  }

  return (
    <>
      <button className="btn btn-ghost" onClick={() => go('quotes')} style={{ marginBottom: 14, paddingInline: 0 }}>← All quotes</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-accent-700)', marginBottom: 3 }}>Quote {q.number}</div>
          <h1 style={{ fontSize: 32, margin: '0 0 3px' }}>{q.title}</h1>
          <p style={{ fontSize: 13.5, color: 'var(--color-neutral-700)', margin: 0 }}>Issued {formatDate(q.createdAt)} · Prepared for {data.client?.name}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ marginBottom: 6 }}><span className={`tag ${toneFor(q.status)}`}>{q.status}</span></div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 38, lineHeight: 1 }}>{eur(quoteTotal(q))}</div>
        </div>
      </div>

      <div className="blueprint" style={{ padding: 0, marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px 110px', gap: 8, padding: '9px 18px', borderBottom: '1px solid var(--color-divider)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-neutral-600)' }}>
          <span>Item</span><span style={{ textAlign: 'right' }}>Qty</span><span style={{ textAlign: 'right' }}>Unit</span><span style={{ textAlign: 'right' }}>Amount</span>
        </div>
        {q.items.map((it) => (
          <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px 110px', gap: 8, padding: '12px 18px', borderBottom: '1px solid color-mix(in srgb,var(--color-text) 8%,transparent)', fontSize: 14, alignItems: 'baseline' }}>
            <span style={{ fontWeight: 500 }}>{it.name}</span>
            <span style={{ textAlign: 'right' }}>{it.qty}</span>
            <span style={{ textAlign: 'right' }}>{eur(it.unitPrice)}</span>
            <span style={{ textAlign: 'right' }}>{eur(it.qty * it.unitPrice)}</span>
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px 110px', gap: 8, padding: '14px 18px', alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 17 }}>Total</span><span /><span />
          <span style={{ textAlign: 'right', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 21 }}>{eur(quoteTotal(q))}</span>
        </div>
      </div>

      {q.status === 'Awaiting response' ? (
        <div className="blueprint" style={{ padding: '18px 20px' }}>
          <h3 style={{ fontSize: 20, margin: '0 0 3px' }}>Your decision</h3>
          <p style={{ fontSize: 13, color: 'var(--color-neutral-700)', margin: '0 0 12px' }}>Approving books the work in. We'll confirm dates by email within one working day.</p>
          {error && <div className="pt-callout" style={{ marginBottom: 12 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={approve} disabled={busy} style={{ padding: '9px 20px' }}>{busy ? 'Approving…' : `Approve ${eur(quoteTotal(q))}`}</button>
            <button className="btn btn-ghost" onClick={() => go('request')}>Ask a question</button>
          </div>
        </div>
      ) : (q.status === 'Approved' || q.status === 'Converted') ? (
        <div className="blueprint" style={{ padding: '18px 20px', background: 'var(--color-accent-900)', color: 'var(--color-bg)', borderColor: 'var(--color-accent-900)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ flex: 'none', marginTop: 2 }}><IconCheck size={26} /></span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ fontSize: 21, margin: '0 0 3px', color: 'var(--color-bg)' }}>Approved — thank you</h3>
              <p style={{ fontSize: 13.5, opacity: 0.82, margin: 0 }}>{q.number} is accepted. A job has been raised and we'll confirm dates within one working day.</p>
            </div>
            <button className="btn" onClick={() => go('jobs')} style={{ borderColor: 'color-mix(in srgb,var(--color-bg) 40%,transparent)', color: 'var(--color-bg)' }}>See jobs</button>
          </div>
        </div>
      ) : null}
    </>
  )
}
