import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useStore, eur, eurExact, itemsTotal, formatDate } from '../../data/store'
import { COMPANY } from '../../data/company'
import type { LineItem } from '../../data/types'
import './print.css'

// A standalone, print-optimised quote/invoice document. Rendered outside the
// admin chrome; auto-opens the browser print dialog (→ Save as PDF).
export default function PrintDocument({ kind }: { kind: 'quote' | 'invoice' }) {
  const { id } = useParams()
  const nav = useNavigate()
  const { state } = useStore()

  const quote = kind === 'quote' ? state.quotes.find((q) => q.id === id) : undefined
  const invoice = kind === 'invoice' ? state.invoices.find((i) => i.id === id) : undefined
  const record = quote ?? invoice
  const client = record ? state.clients.find((c) => c.id === record.clientId) : undefined

  useEffect(() => {
    if (!record) return
    const t = setTimeout(() => window.print(), 500)
    return () => clearTimeout(t)
  }, [record])

  if (!record) {
    return (
      <div className="doc-screen">
        <p style={{ padding: 40 }}>
          Document not found. <Link to={kind === 'quote' ? '/quotes' : '/invoices'}>Go back</Link>
        </p>
      </div>
    )
  }

  const items = record.items as LineItem[]
  const total = itemsTotal(items)
  const heading = kind === 'quote' ? 'Quote' : 'Invoice'

  return (
    <div className="doc-screen">
      <div className="doc-toolbar">
        <button className="doc-back" onClick={() => nav(kind === 'quote' ? `/quotes/${id}` : `/invoices/${id}`)}>
          ← Back
        </button>
        <button className="doc-print" onClick={() => window.print()}>Print / Save as PDF</button>
      </div>

      <div className="doc-sheet">
        <header className="doc-head">
          <div>
            <div className="doc-company">{COMPANY.name}</div>
            {COMPANY.addressLines.map((l) => (
              <div key={l} className="doc-muted">{l}</div>
            ))}
            <div className="doc-muted">{COMPANY.email} · {COMPANY.phone}</div>
            {COMPANY.vat && <div className="doc-muted">VAT {COMPANY.vat}</div>}
          </div>
          <div className="doc-title">
            <h1>{heading.toUpperCase()}</h1>
            <div className="doc-number">{record.number}</div>
          </div>
        </header>

        <section className="doc-meta">
          <div>
            <div className="doc-label">Billed to</div>
            <div className="doc-strong">{client?.name ?? 'Unknown'}</div>
            {client?.company && <div className="doc-muted">{client.company}</div>}
            {client?.address && <div className="doc-muted">{client.address}</div>}
            {client?.email && <div className="doc-muted">{client.email}</div>}
          </div>
          <div className="doc-meta-right">
            {quote && (
              <>
                <div><span className="doc-label">Date</span><span>{formatDate(quote.createdAt)}</span></div>
                <div><span className="doc-label">Status</span><span>{quote.status}</span></div>
                <div><span className="doc-label">Valid until</span><span>{addDays(quote.createdAt, 30)}</span></div>
              </>
            )}
            {invoice && (
              <>
                <div><span className="doc-label">Issued</span><span>{formatDate(invoice.issuedOn)}</span></div>
                <div><span className="doc-label">Due</span><span>{formatDate(invoice.dueOn)}</span></div>
                <div><span className="doc-label">Status</span><span>{invoice.status}</span></div>
              </>
            )}
          </div>
        </section>

        {quote && <div className="doc-subject">{quote.title}</div>}

        <table className="doc-table">
          <thead>
            <tr>
              <th>Description</th>
              <th className="r">Qty</th>
              <th className="r">Unit price</th>
              <th className="r">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={4} className="doc-muted">No line items.</td></tr>
            )}
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.name}</td>
                <td className="r">{it.qty}</td>
                <td className="r">{eurExact(it.unitPrice)}</td>
                <td className="r">{eurExact(it.qty * it.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="r doc-total-label">Total</td>
              <td className="r doc-total">{eur(total)}</td>
            </tr>
          </tfoot>
        </table>

        <footer className="doc-footer">
          {kind === 'invoice' ? (
            <p>Payment due by {formatDate(invoice!.dueOn)}. Thank you for your business.</p>
          ) : (
            <p>This quote is valid for 30 days. We look forward to working with you.</p>
          )}
          <p className="doc-muted">{COMPANY.name} · {COMPANY.email}</p>
        </footer>
      </div>
    </div>
  )
}

function addDays(iso: string, n: number) {
  if (!iso) return '—'
  const d = new Date(iso)
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
}
