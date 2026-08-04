import { usePortal } from '../PortalData'
import { usePortalNav } from '../PortalNav'
import { eur, invoiceTotal, formatDate } from '../../data/store'
import { openInvoices, outstandingTotal, pastDueInvoices, daysUntil } from '../derive'

const toneFor = (status: string) => (status === 'Paid' ? 'tag-neutral' : status === 'Past due' ? 'tag-outline' : 'tag-accent')

export function Invoices() {
  const { data } = usePortal()
  const { go } = usePortalNav()
  const invoices = data.invoices.filter((i) => i.status !== 'Draft')

  const pastDue = pastDueInvoices(data)
  const pastDueTotal = pastDue.reduce((s, i) => s + invoiceTotal(i), 0)
  const paidYear = data.invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + invoiceTotal(i), 0)

  return (
    <>
      <h1 style={{ fontSize: 32, margin: '0 0 4px' }}>Invoices &amp; statement</h1>
      <p style={{ fontSize: 14, color: 'var(--color-neutral-700)', margin: '0 0 20px' }}>Everything billed to {data.client?.name}, and what's still open.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16, marginBottom: 26 }}>
        <div className="blueprint" style={{ padding: '15px 17px' }}>
          <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-neutral-600)' }}>Outstanding</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 34, lineHeight: 1.1, margin: '5px 0 2px' }}>{eur(outstandingTotal(data))}</div>
          <div style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>{openInvoices(data).length} open</div>
        </div>
        <div style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--pt-r)', padding: '15px 17px' }}>
          <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-neutral-600)' }}>Past due</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 34, lineHeight: 1.1, margin: '5px 0 2px' }}>{eur(pastDueTotal)}</div>
          <div style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>{pastDue.length} invoice{pastDue.length === 1 ? '' : 's'}</div>
        </div>
        <div style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--pt-r)', padding: '15px 17px' }}>
          <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-neutral-600)' }}>Paid</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 34, lineHeight: 1.1, margin: '5px 0 2px' }}>{eur(paidYear)}</div>
          <div style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>Across {data.invoices.filter((i) => i.status === 'Paid').length} invoices</div>
        </div>
      </div>

      {invoices.length === 0 ? (
        <p style={{ color: 'var(--color-neutral-700)' }}>No invoices yet.</p>
      ) : (
        <div style={{ borderTop: '1px solid var(--color-divider)' }}>
          {invoices.map((i) => (
            <button key={i.id} className="prow" onClick={() => go('invoice', i.id)} style={{ display: 'flex', alignItems: 'center', gap: 18, width: '100%', textAlign: 'left', padding: '16px 12px', border: 'none', borderBottom: '1px solid var(--color-divider)', background: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer', flexWrap: 'wrap' }}>
              <span style={{ width: 74, flex: 'none', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14 }}>{i.number}</span>
              <span style={{ flex: 1, minWidth: 150 }}>
                <span style={{ display: 'block', fontSize: 14.5 }}>Issued {formatDate(i.issuedOn)}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--color-neutral-700)', marginTop: 1 }}>Due {formatDate(i.dueOn)}</span>
              </span>
              <span className={`tag ${toneFor(i.status)}`}>{i.status}</span>
              <span style={{ width: 82, textAlign: 'right', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 19 }}>{eur(invoiceTotal(i))}</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}

export function InvoiceDetail() {
  const { data } = usePortal()
  const { id, go } = usePortalNav()
  const i = data.invoices.find((x) => x.id === id)
  if (!i) return <button className="btn btn-ghost" onClick={() => go('invoices')}>← All invoices</button>

  const overdue = i.status !== 'Paid' && daysUntil(i.dueOn) < 0

  return (
    <>
      <button className="btn btn-ghost" onClick={() => go('invoices')} style={{ marginBottom: 14, paddingInline: 0 }}>← All invoices</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-accent-700)', marginBottom: 3 }}>Invoice</div>
          <h1 style={{ fontSize: 32, margin: '0 0 3px' }}>{i.number}</h1>
          <p style={{ fontSize: 13.5, color: 'var(--color-neutral-700)', margin: 0 }}>Issued {formatDate(i.issuedOn)} · Due {formatDate(i.dueOn)}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ marginBottom: 6 }}>
            {overdue
              ? <span style={{ display: 'inline-flex', fontSize: 11, padding: '3px 10px', borderRadius: 999, background: 'var(--color-accent-900)', color: 'var(--color-bg)' }}>{Math.abs(daysUntil(i.dueOn))} days past due</span>
              : <span className={`tag ${toneFor(i.status)}`}>{i.status}</span>}
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 38, lineHeight: 1 }}>{eur(invoiceTotal(i))}</div>
        </div>
      </div>

      <div className="blueprint" style={{ padding: 0, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px 110px', gap: 8, padding: '9px 18px', borderBottom: '1px solid var(--color-divider)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-neutral-600)' }}>
          <span>Item</span><span style={{ textAlign: 'right' }}>Qty</span><span style={{ textAlign: 'right' }}>Unit</span><span style={{ textAlign: 'right' }}>Amount</span>
        </div>
        {i.items.map((it) => (
          <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px 110px', gap: 8, padding: '12px 18px', borderBottom: '1px solid color-mix(in srgb,var(--color-text) 8%,transparent)', fontSize: 14 }}>
            <span>{it.name}</span><span style={{ textAlign: 'right' }}>{it.qty}</span><span style={{ textAlign: 'right' }}>{eur(it.unitPrice)}</span><span style={{ textAlign: 'right' }}>{eur(it.qty * it.unitPrice)}</span>
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px 110px', gap: 8, padding: '14px 18px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 17 }}>Total due</span><span /><span />
          <span style={{ textAlign: 'right', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 21 }}>{eur(invoiceTotal(i))}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 26 }}>
        {i.status !== 'Paid' && <button className="btn btn-primary" onClick={() => go('pay', i.id)} style={{ padding: '9px 22px' }}>Pay {eur(invoiceTotal(i))} now</button>}
        <button className="btn btn-ghost" onClick={() => go('request')}>Query this invoice</button>
      </div>

      <div style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--pt-r)', padding: '14px 16px', fontSize: 13, lineHeight: 1.55, color: 'var(--color-neutral-800)', maxWidth: 520 }}>
        <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-neutral-600)', marginBottom: 6 }}>Pay by transfer</div>
        C.Healy Engineering, Annacurra<br />IBAN IE29 AIBK 9311 5212 3456 78 · BIC AIBKIE2D<br />Please quote <strong>{i.number}</strong> as the reference.
      </div>
    </>
  )
}
