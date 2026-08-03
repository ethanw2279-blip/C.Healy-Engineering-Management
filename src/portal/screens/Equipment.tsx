import { useState } from 'react'
import { usePortal } from '../PortalData'
import { usePortalNav } from '../PortalNav'
import { formatDate } from '../../data/store'
import { registerStatus, ga1Description } from '../../data/ga1'
import { downloadRegisterCsv, downloadRegisterPdf } from '../../data/ga1Export'
import { daysUntil } from '../derive'
import { IconDownload } from '../icons'

const tone = (g: { overallResult: string }) => (g.overallResult === 'safe' ? 'tag-accent' : 'tag-outline')

export default function Equipment() {
  const { data } = usePortal()
  const { go } = usePortalNav()
  const rows = data.ga1
  const clientName = data.client?.company || data.client?.name || 'client'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pdf = async () => {
    setError(null); setBusy(true)
    try { await downloadRegisterPdf(clientName) } catch (e) { setError(e instanceof Error ? e.message : 'Could not download the register.') } finally { setBusy(false) }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 32, margin: '0 0 4px' }}>Equipment &amp; GA1</h1>
          <p style={{ fontSize: 14, color: 'var(--color-neutral-700)', margin: 0 }}>Every asset we've examined for you, its certificate, and when the next thorough examination falls due.</p>
        </div>
        {rows.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={pdf} disabled={busy}><IconDownload size={15} />{busy ? 'Preparing…' : 'Register (PDF)'}</button>
            <button className="btn btn-secondary" onClick={() => downloadRegisterCsv(rows, clientName, formatDate)}><IconDownload size={15} />Register (CSV)</button>
          </div>
        )}
      </div>

      {error && <div className="pt-callout" style={{ marginBottom: 16 }}>{error}</div>}

      {rows.length === 0 ? (
        <p style={{ color: 'var(--color-neutral-700)' }}>No GA1 reports on file yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {rows.map((e) => {
            const dd = daysUntil(e.nextExaminationDate)
            return (
              <div key={e.id} className="blueprint" style={{ padding: '16px 20px', display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 210 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 20, lineHeight: 1.15 }}>{ga1Description(e)}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-neutral-700)', marginTop: 2 }}>Serial {e.serialNumber || '—'}{e.swl ? ` · SWL ${e.swl}` : ''}</div>
                </div>
                <div style={{ minWidth: 120 }}>
                  <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-neutral-600)' }}>Last examined</div>
                  <div style={{ fontSize: 14.5, marginTop: 2 }}>{formatDate(e.examinationDate)}</div>
                </div>
                <div style={{ minWidth: 120 }}>
                  <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-neutral-600)' }}>Next due</div>
                  <div style={{ fontSize: 14.5, marginTop: 2 }}>{formatDate(e.nextExaminationDate)}{dd < 0 ? ' · overdue' : ''}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', marginLeft: 'auto' }}>
                  <span className={`tag ${tone(e)}`}>{registerStatus(e)}</span>
                  <a className="btn btn-secondary" href={`/api/ga1/${e.id}/pdf`} target="_blank" rel="noreferrer" style={{ fontSize: 12.5 }}>{e.reportNumber} PDF</a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--pt-r)', padding: '15px 18px', marginTop: 22, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, fontSize: 13.5, lineHeight: 1.55 }}>
          <strong>Reminders are on.</strong> We'll email you before each examination falls due.
        </div>
        <button className="btn btn-primary" onClick={() => go('request')}>Book an inspection</button>
      </div>
    </>
  )
}
