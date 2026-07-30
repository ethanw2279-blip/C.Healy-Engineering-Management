import { useNavigate } from 'react-router-dom'
import { usePortal } from './PortalData'
import { eur, quoteTotal, invoiceTotal, formatDate } from '../data/store'

const quoteTone: Record<string, string> = {
  'Awaiting response': 'amber', Approved: 'green', Converted: 'green',
}
const invoiceTone: Record<string, string> = {
  'Awaiting payment': 'amber', Paid: 'green', 'Past due': 'red',
}
const jobTone: Record<string, string> = {
  Complete: 'green', Active: 'amber', Scheduled: 'amber',
}

export default function PortalHome() {
  const { data } = usePortal()
  const nav = useNavigate()

  const awaiting = data.quotes.filter((q) => q.status === 'Awaiting response')

  return (
    <div className="portal-page">
      <h1 className="portal-h1">Welcome{data.client ? `, ${data.client.name.split(' ')[0]}` : ''}</h1>
      <p className="portal-sub">Your quotes, work, and invoices with C.Healy Engineering.</p>

      {awaiting.length > 0 && (
        <div className="portal-callout">
          {awaiting.length === 1 ? 'You have a quote awaiting your approval.' : `You have ${awaiting.length} quotes awaiting your approval.`}
        </div>
      )}

      <section className="portal-section">
        <h2>GA1 Reports</h2>
        {data.ga1.length === 0 ? (
          <p className="portal-muted">No GA1 reports yet.</p>
        ) : (
          <button className="portal-card" onClick={() => nav('/portal/ga1')}>
            <div className="portal-card-main">
              <strong>{data.ga1.length} inspection {data.ga1.length === 1 ? 'report' : 'reports'}</strong>
              <span>View certificates and download your register</span>
            </div>
            <span className="badge badge-grey">Open →</span>
          </button>
        )}
      </section>

      <section className="portal-section">
        <h2>Quotes</h2>
        {data.quotes.length === 0 ? (
          <p className="portal-muted">No quotes yet.</p>
        ) : (
          <div className="portal-cards">
            {data.quotes.map((q) => (
              <button key={q.id} className="portal-card" onClick={() => nav(`/portal/quotes/${q.id}`)}>
                <div className="portal-card-main">
                  <strong>{q.title}</strong>
                  <span>{q.number} · {formatDate(q.createdAt)}</span>
                </div>
                <div className="portal-card-side">
                  <span className={`badge badge-${quoteTone[q.status] ?? 'grey'}`}>{q.status}</span>
                  <b>{eur(quoteTotal(q))}</b>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="portal-section">
        <h2>Jobs</h2>
        {data.jobs.length === 0 ? (
          <p className="portal-muted">No jobs yet.</p>
        ) : (
          <div className="portal-cards">
            {data.jobs.map((j) => (
              <div key={j.id} className="portal-card static">
                <div className="portal-card-main">
                  <strong>{j.title}</strong>
                  <span>{j.number}{j.startDate ? ` · ${formatDate(j.startDate)}` : ''}</span>
                </div>
                <span className={`badge badge-${jobTone[j.status] ?? 'grey'}`}>{j.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="portal-section">
        <h2>Invoices</h2>
        {data.invoices.length === 0 ? (
          <p className="portal-muted">No invoices yet.</p>
        ) : (
          <div className="portal-cards">
            {data.invoices.map((i) => (
              <button key={i.id} className="portal-card" onClick={() => nav(`/portal/invoices/${i.id}`)}>
                <div className="portal-card-main">
                  <strong>{i.number}</strong>
                  <span>Due {formatDate(i.dueOn)}</span>
                </div>
                <div className="portal-card-side">
                  <span className={`badge badge-${invoiceTone[i.status] ?? 'grey'}`}>{i.status}</span>
                  <b>{eur(invoiceTotal(i))}</b>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
