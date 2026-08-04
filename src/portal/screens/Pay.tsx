import { useEffect, useState } from 'react'
import { usePortal } from '../PortalData'
import { usePortalNav } from '../PortalNav'
import { eur, invoiceTotal } from '../../data/store'
import { startCheckout, confirmCheckout } from '../actions'
import { IconCheck } from '../icons'

type Mode = 'card' | 'bank'

export default function Pay() {
  const { data, refresh } = usePortal()
  const { id, go } = usePortalNav()
  const invoice = data.invoices.find((x) => x.id === id)

  const [mode, setMode] = useState<Mode>('card')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Returning from Stripe Checkout: confirm the session and mark paid.
  const returnedSession = new URLSearchParams(window.location.search).get('session_id')
  const [confirming, setConfirming] = useState(!!returnedSession)
  const [paidInvoice, setPaidInvoice] = useState<string | null>(null)

  useEffect(() => {
    if (!returnedSession) return
    confirmCheckout(returnedSession)
      .then((r) => { if (r.paid) { setPaidInvoice(r.invoiceNumber || 'your invoice'); refresh() } else setError('Payment not completed. If you were charged, it will reconcile shortly.') })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not verify the payment.'))
      .finally(() => setConfirming(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnedSession])

  if (confirming) return <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-neutral-700)' }}>Confirming your payment…</div>

  if (paidInvoice) {
    return (
      <div style={{ maxWidth: 520, margin: '40px auto 0', textAlign: 'center' }}>
        <div className="blueprint" style={{ padding: '34px 28px' }}>
          <div style={{ width: 56, height: 56, margin: '0 auto 16px', display: 'grid', placeItems: 'center', background: 'var(--color-accent)', color: 'var(--color-bg)', borderRadius: 999 }}><IconCheck size={28} /></div>
          <h1 style={{ fontSize: 30, margin: '0 0 6px' }}>Payment received</h1>
          <p style={{ fontSize: 14, color: 'var(--color-neutral-700)', margin: '0 0 20px' }}>Thank you — {paidInvoice} is now settled and a receipt is on its way.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => go('invoices')}>All invoices</button>
            <button className="btn btn-primary" onClick={() => go('home')}>Back to overview</button>
          </div>
        </div>
      </div>
    )
  }

  if (!invoice) return <button className="btn btn-ghost" onClick={() => go('invoices')}>← All invoices</button>

  const payByCard = async () => {
    setError(null); setBusy(true)
    try {
      const { url } = await startCheckout(invoice.id)
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the payment.')
      setMode('bank')
      setBusy(false)
    }
  }

  return (
    <>
      <button className="btn btn-ghost" onClick={() => go('invoice', invoice.id)} style={{ marginBottom: 14, paddingInline: 0 }}>← Cancel</button>
      <h1 style={{ fontSize: 32, margin: '0 0 4px' }}>Pay {invoice.number}</h1>
      <p style={{ fontSize: 14, color: 'var(--color-neutral-700)', margin: '0 0 22px' }}>Card payments are handled securely by Stripe. Nothing is stored on our servers.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 22, alignItems: 'start' }}>
        <div className="blueprint" style={{ padding: '18px 20px' }}>
          <div className="seg" style={{ marginBottom: 16 }}>
            <label className="seg-opt"><input type="radio" name="paym" checked={mode === 'card'} onChange={() => setMode('card')} />Card</label>
            <label className="seg-opt"><input type="radio" name="paym" checked={mode === 'bank'} onChange={() => setMode('bank')} />Bank transfer</label>
          </div>

          {error && <div className="pt-callout" style={{ marginBottom: 12 }}>{error}</div>}

          {mode === 'card' ? (
            <>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: '0 0 14px' }}>You'll be taken to Stripe's secure checkout to pay <strong>{eur(invoiceTotal(invoice))}</strong> by card, then brought back here.</p>
              <button className="btn btn-primary btn-block" onClick={payByCard} disabled={busy} style={{ padding: 11 }}>{busy ? 'Redirecting…' : `Pay ${eur(invoiceTotal(invoice))} by card`}</button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: '0 0 14px' }}>Transfer <strong>{eur(invoiceTotal(invoice))}</strong> to the account below — we'll mark it paid when it lands, usually the same working day.</p>
              <div style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--pt-r)', padding: '13px 15px', fontSize: 13.5, lineHeight: 1.7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--color-neutral-700)' }}>Account name</span><span>C.Healy Engineering</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--color-neutral-700)' }}>IBAN</span><span>IE29 AIBK 9311 5212 3456 78</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--color-neutral-700)' }}>BIC</span><span>AIBKIE2D</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--color-neutral-700)' }}>Reference</span><strong>{invoice.number}</strong></div>
              </div>
            </>
          )}
        </div>

        <div style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--pt-r)', padding: '18px 20px' }}>
          <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-neutral-600)', marginBottom: 10 }}>Paying</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid color-mix(in srgb,var(--color-text) 8%,transparent)', fontSize: 14 }}><span>{invoice.number}</span><span>{eur(invoiceTotal(invoice))}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingTop: 12, fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 22 }}><span>Total</span><span>{eur(invoiceTotal(invoice))}</span></div>
        </div>
      </div>
    </>
  )
}
