import { useState } from 'react'
import { usePortal } from './PortalData'
import { formatDate } from '../data/store'
import { GA1_EXAM_TYPE, ga1Description, registerStatus, resultTone } from '../data/ga1'
import { downloadRegisterCsv, downloadRegisterPdf } from '../data/ga1Export'

export default function PortalGA1() {
  const { data } = usePortal()
  const rows = data.ga1
  const clientName = data.client?.company || data.client?.name || 'client'

  const [busy, setBusy] = useState<null | 'csv' | 'pdf'>(null)
  const [error, setError] = useState<string | null>(null)

  const csv = () => {
    setError(null)
    downloadRegisterCsv(rows, clientName, formatDate)
  }
  const pdf = async () => {
    setError(null)
    setBusy('pdf')
    try {
      await downloadRegisterPdf(clientName) // client login → server scopes to own reports
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not download the register.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="portal-page">
      <h1 className="portal-h1">GA1 Reports</h1>
      <p className="portal-sub">
        Your thorough-examination certificates and the register of all machines, indexed by cert number.
      </p>

      {rows.length > 0 && (
        <div className="portal-actions">
          <button className="portal-btn" onClick={pdf} disabled={busy === 'pdf'}>
            {busy === 'pdf' ? 'Preparing…' : 'Download register (PDF)'}
          </button>
          <button className="portal-btn ghost" onClick={csv} disabled={busy === 'csv'}>
            Download register (CSV)
          </button>
        </div>
      )}
      {error && <div className="portal-callout">{error}</div>}

      <section className="portal-section">
        {rows.length === 0 ? (
          <p className="portal-muted">No GA1 reports on file yet.</p>
        ) : (
          <div className="portal-table-wrap">
            <table className="portal-ga1-table">
              <thead>
                <tr>
                  <th>Exam Type</th>
                  <th>Serial No.</th>
                  <th>Description</th>
                  <th>Location</th>
                  <th>Exam Date</th>
                  <th>Next Exam</th>
                  <th>Status</th>
                  <th>Cert No.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((g) => (
                  <tr key={g.id}>
                    <td>{GA1_EXAM_TYPE}</td>
                    <td>{g.serialNumber || '—'}</td>
                    <td>{ga1Description(g)}</td>
                    <td>{g.examinationLocation || '—'}</td>
                    <td>{formatDate(g.examinationDate)}</td>
                    <td>{formatDate(g.nextExaminationDate)}</td>
                    <td><span className={`badge badge-${resultTone[g.overallResult]}`}>{registerStatus(g)}</span></td>
                    <td>
                      <a className="portal-link" href={`/api/ga1/${g.id}/pdf`} target="_blank" rel="noreferrer">
                        {g.reportNumber || 'View'}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
