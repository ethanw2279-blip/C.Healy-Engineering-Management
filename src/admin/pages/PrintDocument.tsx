import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useStore, eur, eurExact, itemsTotal, formatDate } from '../../data/store'
import { COMPANY } from '../../data/company'
import type { LineItem } from '../../data/types'
import './print.css'

// A standalone, print-optimised quote/invoice document in the C. Healy
// dark/brass brand. Rendered outside the admin chrome; true A4 (never scaled),
// so long documents flow onto additional A4 pages. Auto-opens the browser
// print dialog (→ Save as PDF) once webfonts have loaded.
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
    let cancelled = false
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    // Wait for Archivo/IBM Plex Mono before printing so the PDF isn't rendered
    // in the fallback face. Fall back to a short timeout if the Font Loading
    // API is unavailable.
    const ready = fonts?.ready ?? Promise.resolve()
    ready.then(() => {
      if (cancelled) return
      setTimeout(() => window.print(), 300)
    })
    return () => {
      cancelled = true
    }
  }, [record])

  if (!record) {
    return (
      <div className="doc-screen">
        <p style={{ padding: 40, color: '#F7F6F3' }}>
          Document not found. <Link to={kind === 'quote' ? '/quotes' : '/invoices'}>Go back</Link>
        </p>
      </div>
    )
  }

  const items = record.items as LineItem[]
  const total = itemsTotal(items)
  const heading = kind === 'quote' ? 'Quote' : 'Invoice'

  // Brand lockup: first word on line one, the remainder on line two
  // (e.g. "C.Healy" / "Engineering"), matching the uploaded design.
  const [brandFirst, ...brandRest] = COMPANY.name.split(' ')
  const brandSecond = brandRest.join(' ')

  const contactLeft = `${COMPANY.name}  ·  ${COMPANY.addressLines[COMPANY.addressLines.length - 1] ?? 'Ireland'}`
  const contactRight = [COMPANY.phone, COMPANY.email].filter(Boolean).join('  ·  ')

  return (
    <div className="doc-screen">
      <div className="doc-toolbar">
        <button
          className="doc-back"
          onClick={() => nav(kind === 'quote' ? `/quotes/${id}` : `/invoices/${id}`)}
        >
          ← Back
        </button>
        <button className="doc-print" onClick={() => window.print()}>Print / Save as PDF</button>
      </div>

      <div className="doc-sheet">
        <div className="doc-body">
          {/* Header band */}
          <header className="doc-head">
            <div>
              <div className="doc-brand-name">
                {brandFirst}
                {brandSecond && <br />}
                {brandSecond}
              </div>
              <div className="doc-brand-rule" />
              <div className="doc-brand-tag">{COMPANY.tagline}</div>
            </div>
            <div className="doc-head-right">
              <div className="doc-kind">{heading}</div>
              <div className="doc-meta">
                <div>{record.number}</div>
                {invoice && (
                  <>
                    <div>Issued&nbsp;&nbsp;{formatDate(invoice.issuedOn)}</div>
                    <div className="due">Due&nbsp;&nbsp;&nbsp;&nbsp;{formatDate(invoice.dueOn)}</div>
                  </>
                )}
                {quote && (
                  <>
                    <div>Issued&nbsp;&nbsp;{formatDate(quote.createdAt)}</div>
                    <div className="due">Valid&nbsp;&nbsp;{addDays(quote.createdAt, 30)}</div>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="doc-pad">
            {/* Billed to + status */}
            <section className="doc-billto">
              <div>
                <div className="doc-eyebrow">Billed to</div>
                <div className="doc-party">{client?.name ?? 'Unknown'}</div>
                <div className="doc-lines">
                  {client?.company && <>{client.company}<br /></>}
                  {client?.address && <>{client.address}<br /></>}
                  {client?.email}
                </div>
              </div>
              <div>
                <div className="doc-eyebrow">Status</div>
                <div className="doc-detail-list">
                  <div>{record.status}</div>
                  {invoice && <div className="due">Due {formatDate(invoice.dueOn)}</div>}
                  {quote && <div className="due">Valid until {addDays(quote.createdAt, 30)}</div>}
                </div>
              </div>
            </section>

            {quote?.title && <div className="doc-subject">{quote.title}</div>}

            {/* Line items */}
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="r c-qty">Qty</th>
                  <th className="r c-unit">Unit</th>
                  <th className="r c-amt">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="doc-empty">No line items.</td>
                  </tr>
                )}
                {items.map((it) => (
                  <tr key={it.id}>
                    <td>
                      <div className="doc-item-title">{it.name}</div>
                    </td>
                    <td className="r doc-num ink">{it.qty}</td>
                    <td className="r doc-num mut">{eurExact(it.unitPrice)}</td>
                    <td className="r doc-num ink">{eurExact(it.qty * it.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <section className="doc-totals">
              <div className="doc-totals-inner">
                <div className="doc-total-row bordered">
                  <span>Subtotal</span>
                  <span>{eurExact(total)}</span>
                </div>
                <div className="doc-amount-due">
                  <span className="label">Amount due</span>
                  <span className="value">{eur(total)}</span>
                </div>
              </div>
            </section>

            {/* Terms + notes */}
            <section className="doc-terms">
              <div>
                <div className="doc-eyebrow">Payment terms</div>
                <div className="body">
                  {invoice ? (
                    <>Payment due by {formatDate(invoice.dueOn)}, quoting reference {invoice.number}.
                    {COMPANY.vat ? ` VAT ${COMPANY.vat}.` : ''}</>
                  ) : (
                    <>This quote is valid for 30 days from {formatDate(quote!.createdAt)}. Prices held
                    subject to material availability.</>
                  )}
                </div>
              </div>
              <div>
                <div className="doc-eyebrow">Notes</div>
                <div className="body">
                  Any queries on this {kind}, call us on {COMPANY.phone} or email {COMPANY.email}.
                </div>
              </div>
            </section>

            {/* Tagline strip */}
            <div className="doc-callout">
              <span className="lead">Done once. Done right. On time.</span>
              <span className="sub">
                &nbsp;&nbsp;
                {kind === 'invoice'
                  ? "Thanks for the work — we'll see you on the next one."
                  : 'We look forward to working with you.'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer strip */}
        <footer className="doc-foot">
          <span>{contactLeft}</span>
          <span>{contactRight}</span>
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
