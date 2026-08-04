import { useState } from 'react'
import { usePortal } from '../PortalData'
import { formatDate } from '../../data/store'
import { openDocument } from '../actions'
import { IconDocs } from '../icons'

const FILTERS = ['All', 'Certificates', 'Files'] as const

function sizeLabel(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function Documents() {
  const { data } = usePortal()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  const docs = data.documents.filter((d) =>
    (filter === 'All' || d.category === filter) && d.name.toLowerCase().includes(query.trim().toLowerCase()))

  const open = async (attachmentId: string) => {
    setError(null)
    try { await openDocument(attachmentId) } catch (e) { setError(e instanceof Error ? e.message : 'Could not open the document.') }
  }

  return (
    <>
      <h1 style={{ fontSize: 32, margin: '0 0 4px' }}>Documents</h1>
      <p style={{ fontSize: 14, color: 'var(--color-neutral-700)', margin: '0 0 18px' }}>Certificates, method statements and reports — everything we've issued you, in one place.</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div className="seg">
          {FILTERS.map((f) => (
            <label key={f} className="seg-opt"><input type="radio" name="docfilter" checked={filter === f} onChange={() => setFilter(f)} />{f}</label>
          ))}
        </div>
        <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents…" style={{ maxWidth: 230, fontSize: 13 }} />
      </div>

      {error && <div className="pt-callout" style={{ marginBottom: 14 }}>{error}</div>}

      {docs.length === 0 ? (
        <p style={{ padding: '34px 0', textAlign: 'center', color: 'var(--color-neutral-700)', fontSize: 14 }}>Nothing matches that yet.</p>
      ) : (
        <div style={{ borderTop: '1px solid var(--color-divider)' }}>
          {docs.map((d) => (
            <div key={d.id} className="prow" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 12px', borderBottom: '1px solid var(--color-divider)', flexWrap: 'wrap' }}>
              <span style={{ flex: 'none', opacity: 0.55 }}><IconDocs size={19} /></span>
              <span style={{ flex: 1, minWidth: 180 }}>
                <span style={{ display: 'block', fontSize: 14.5, fontWeight: 500 }}>{d.name}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--color-neutral-700)', marginTop: 1 }}>{d.kind}{d.date ? ` · ${formatDate(d.date)}` : ''}{d.size ? ` · ${sizeLabel(d.size)}` : ''}</span>
              </span>
              {d.url
                ? <a className="btn btn-secondary" href={d.url} target="_blank" rel="noreferrer" style={{ fontSize: 12.5 }}>Download</a>
                : <button className="btn btn-secondary" onClick={() => d.attachmentId && open(d.attachmentId)} style={{ fontSize: 12.5 }}>Download</button>}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
