import { useParams, useNavigate } from 'react-router-dom'
import { usePortal } from './PortalData'
import { eur, eurExact, invoiceTotal, formatDate } from '../data/store'

const tone: Record<string, string> = {
  'Awaiting payment': 'amber', Paid: 'green', 'Past due': 'red', Draft: 'grey',
}

export default function PortalInvoice() {
  const { id } = useParams()
  const nav = useNavigate()
  const { data } = usePortal()

  const invoice = data.invoices.find((i) => i.id === id)
  if (!invoice) {
    return (
      <div className="portal-page">
        <button className="portal-back" onClick={() => nav('/portal')}>← Back</button>
        <p className="portal-muted">Invoice not found.</p>
      </div>
    )
  }

  return (
    <div className="portal-page">
      <button className="portal-back no-print" onClick={() => nav('/portal')}>← Back</button>

      <div className="portal-doc-head">
        <div>
          <h1 className="portal-h1">Invoice {invoice.number}</h1>
          <p className="portal-sub">Issued {formatDate(invoice.issuedOn)} · Due {formatDate(invoice.dueOn)}</p>
        </div>
        <span className={`badge badge-${tone[invoice.status] ?? 'grey'}`}>{invoice.status}</span>
      </div>

      <div className="portal-table">
        <div className="portal-tr portal-th">
          <span>Item</span><span className="num">Qty</span><span className="num">Price</span><span className="num">Total</span>
        </div>
        {invoice.items.map((it) => (
          <div key={it.id} className="portal-tr">
            <span>{it.name}</span>
            <span className="num">{it.qty}</span>
            <span className="num">{eurExact(it.unitPrice)}</span>
            <span className="num">{eurExact(it.qty * it.unitPrice)}</span>
          </div>
        ))}
        <div className="portal-tr portal-total">
          <span>Total</span><span /><span /><span className="num">{eur(invoiceTotal(invoice))}</span>
        </div>
      </div>

      {invoice.status === 'Paid' ? (
        <div className="portal-approved">✓ Paid — thank you.</div>
      ) : (
        <button className="portal-btn ghost no-print" onClick={() => window.print()}>Print / save PDF</button>
      )}
    </div>
  )
}
