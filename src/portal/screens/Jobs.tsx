import { useState } from 'react'
import { usePortal } from '../PortalData'
import { usePortalNav } from '../PortalNav'
import { eur, jobTotal, formatDate } from '../../data/store'
import { IconChevron } from '../icons'

const toneFor = (status: string) => (status === 'Complete' ? 'tag-neutral' : 'tag-accent')
const FILTERS = ['All', 'Active', 'Complete'] as const

export function Jobs() {
  const { data } = usePortal()
  const { go } = usePortalNav()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')

  const jobs = data.jobs.filter((j) =>
    filter === 'All' ? true : filter === 'Complete' ? j.status === 'Complete' : j.status !== 'Complete')

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 32, margin: '0 0 4px' }}>Jobs &amp; visits</h1>
          <p style={{ fontSize: 14, color: 'var(--color-neutral-700)', margin: 0 }}>Where your work is up to, and who's coming.</p>
        </div>
        <div className="seg">
          {FILTERS.map((f) => (
            <label key={f} className="seg-opt"><input type="radio" name="jobfilter" checked={filter === f} onChange={() => setFilter(f)} />{f}</label>
          ))}
        </div>
      </div>
      {jobs.length === 0 ? (
        <p style={{ color: 'var(--color-neutral-700)' }}>No jobs to show.</p>
      ) : (
        <div style={{ borderTop: '1px solid var(--color-divider)' }}>
          {jobs.map((j) => (
            <button key={j.id} className="prow" onClick={() => go('job', j.id)} style={{ display: 'flex', alignItems: 'center', gap: 18, width: '100%', textAlign: 'left', padding: '16px 12px', border: 'none', borderBottom: '1px solid var(--color-divider)', background: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer', flexWrap: 'wrap' }}>
              <span style={{ width: 74, flex: 'none', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14 }}>{j.number}</span>
              <span style={{ flex: 1, minWidth: 170 }}>
                <span style={{ display: 'block', fontSize: 15.5, fontWeight: 500 }}>{j.title}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--color-neutral-700)', marginTop: 1 }}>{j.startDate ? formatDate(j.startDate) : 'Unscheduled'}</span>
              </span>
              <span className={`tag ${toneFor(j.status)}`}>{j.status}</span>
              <span style={{ opacity: 0.4 }}><IconChevron size={16} /></span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}

export function JobDetail() {
  const { data } = usePortal()
  const { id, go } = usePortalNav()
  const j = data.jobs.find((x) => x.id === id)
  if (!j) return <button className="btn btn-ghost" onClick={() => go('jobs')}>← All jobs</button>

  return (
    <>
      <button className="btn btn-ghost" onClick={() => go('jobs')} style={{ marginBottom: 14, paddingInline: 0 }}>← All jobs</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-accent-700)', marginBottom: 3 }}>Job {j.number}</div>
          <h1 style={{ fontSize: 32, margin: '0 0 3px' }}>{j.title}</h1>
          <p style={{ fontSize: 13.5, color: 'var(--color-neutral-700)', margin: 0 }}>
            {j.startDate ? `Scheduled ${formatDate(j.startDate)}` : 'Not yet scheduled'}{j.endDate ? ` · ends ${formatDate(j.endDate)}` : ''}
          </p>
        </div>
        <span className={`tag ${toneFor(j.status)}`} style={{ fontSize: 12, padding: '5px 12px' }}>{j.status}</span>
      </div>

      {j.items.length > 0 && (
        <div className="blueprint" style={{ padding: 0, marginBottom: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px', gap: 8, padding: '9px 18px', borderBottom: '1px solid var(--color-divider)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-neutral-600)' }}>
            <span>Item</span><span style={{ textAlign: 'right' }}>Qty</span><span style={{ textAlign: 'right' }}>Amount</span>
          </div>
          {j.items.map((it) => (
            <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px', gap: 8, padding: '12px 18px', borderBottom: '1px solid color-mix(in srgb,var(--color-text) 8%,transparent)', fontSize: 14 }}>
              <span>{it.name}</span><span style={{ textAlign: 'right' }}>{it.qty}</span><span style={{ textAlign: 'right' }}>{eur(it.qty * it.unitPrice)}</span>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px', gap: 8, padding: '14px 18px' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 17 }}>Total</span><span />
            <span style={{ textAlign: 'right', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 19 }}>{eur(jobTotal(j))}</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={() => go('request')}>Request a reschedule</button>
        <button className="btn btn-secondary" onClick={() => go('invoices')}>Related invoices</button>
      </div>
    </>
  )
}
