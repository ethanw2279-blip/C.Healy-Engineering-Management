import { usePortal } from '../PortalData'
import { usePortalNav } from '../PortalNav'
import { eur, quoteTotal, invoiceTotal, formatDate } from '../../data/store'
import { awaitingQuotes, pastDueInvoices, openInvoices, activeJobs, ga1Attention, outstandingTotal, daysUntil } from '../derive'

const firstName = (name?: string | null) => (name ? name.split(/\s+/)[0] : 'there')

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Overview() {
  const { data } = usePortal()
  const { go } = usePortalNav()

  const awaiting = awaitingQuotes(data)
  const pastDue = pastDueInvoices(data)
  const nextJob = activeJobs(data).slice().sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))[0]
  const needs = awaiting.length + pastDue.length

  const tiles = [
    { kicker: 'Outstanding', value: eur(outstandingTotal(data)), note: `${openInvoices(data).length} open invoice${openInvoices(data).length === 1 ? '' : 's'}`, view: 'invoices' as const },
    { kicker: 'Active jobs', value: String(activeJobs(data).length), note: 'Scheduled or in progress', view: 'jobs' as const },
    { kicker: 'GA1 attention', value: String(ga1Attention(data).length), note: 'Due soon or needs repair', view: 'equipment' as const },
    { kicker: 'Open quotes', value: String(awaiting.length), note: 'Awaiting your decision', view: 'quotes' as const },
  ]

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 4 }}>
        <div>
          <h1 style={{ fontSize: 34, margin: '0 0 2px' }}>Hi {firstName(data.client?.name)}</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-neutral-700)' }}>{greeting()} — here's where things stand with C.Healy Engineering.</p>
        </div>
        <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-neutral-600)', textAlign: 'right' }}>
          {data.client?.name}
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--color-divider)', margin: '16px 0 22px' }} />

      {needs > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 12 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>Needs you</h2>
            <span style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-accent-700)' }}>{needs} item{needs === 1 ? '' : 's'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20, marginBottom: 34 }}>
            {awaiting.map((q) => (
              <div key={q.id} className="blueprint" style={{ padding: '18px 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-accent-700)' }}>Quote awaiting approval</span>
                  <span className="tag tag-outline">{q.number}</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 22, lineHeight: 1.15 }}>{q.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--color-neutral-700)', marginTop: 2 }}>Issued {formatDate(q.createdAt)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 'auto', paddingTop: 6 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 30, lineHeight: 1 }}>{eur(quoteTotal(q))}</div>
                  <button className="btn btn-primary" onClick={() => go('quote', q.id)}>Review &amp; approve</button>
                </div>
              </div>
            ))}
            {pastDue.map((i) => (
              <div key={i.id} className="blueprint" style={{ padding: '18px 20px 16px', display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--color-accent-900)', color: 'var(--color-bg)', borderColor: 'var(--color-accent-900)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', opacity: 0.75 }}>Invoice past due</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, border: '1px solid color-mix(in srgb,var(--color-bg) 45%,transparent)' }}>{Math.abs(daysUntil(i.dueOn))} days</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 22, lineHeight: 1.15 }}>{i.number}</div>
                  <div style={{ fontSize: 12.5, opacity: 0.75, marginTop: 2 }}>Was due {formatDate(i.dueOn)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 'auto', paddingTop: 6 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 30, lineHeight: 1 }}>{eur(invoiceTotal(i))}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" onClick={() => go('invoice', i.id)} style={{ borderColor: 'color-mix(in srgb,var(--color-bg) 40%,transparent)', color: 'var(--color-bg)' }}>View</button>
                    <button className="btn" onClick={() => go('pay', i.id)} style={{ background: 'var(--color-bg)', color: 'var(--color-accent-900)', borderColor: 'var(--color-bg)' }}>Pay now</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {nextJob && (
        <>
          <h2 style={{ fontSize: 22, margin: '0 0 12px' }}>Next on site</h2>
          <button className="prow blueprint" onClick={() => go('job', nextJob.id)} style={{ display: 'flex', alignItems: 'center', gap: 20, width: '100%', textAlign: 'left', padding: '16px 20px', background: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer', marginBottom: 34, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 19 }}>{nextJob.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--color-neutral-700)', marginTop: 2 }}>{nextJob.number}{nextJob.startDate ? ` · ${formatDate(nextJob.startDate)}` : ''}</div>
            </div>
            <span className="tag tag-accent">{nextJob.status}</span>
          </button>
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
        {tiles.map((t) => (
          <button key={t.kicker} className="prow" onClick={() => go(t.view)} style={{ textAlign: 'left', padding: '15px 16px', border: '1px solid var(--color-divider)', borderRadius: 'var(--pt-r)', background: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer' }}>
            <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-neutral-600)' }}>{t.kicker}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 29, lineHeight: 1.1, margin: '5px 0 2px' }}>{t.value}</div>
            <div style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>{t.note}</div>
          </button>
        ))}
      </div>
    </>
  )
}
