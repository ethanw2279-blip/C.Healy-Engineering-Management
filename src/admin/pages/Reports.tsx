import { PageHeader } from '../components/ui'
import { useStore, eur, quoteTotal, invoiceTotal, jobTotal } from '../../data/store'

export default function Reports() {
  const { state } = useStore()

  const paid = state.invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + invoiceTotal(i), 0)
  const outstanding = state.invoices.filter((i) => i.status !== 'Paid').reduce((s, i) => s + invoiceTotal(i), 0)
  const pipeline = state.quotes
    .filter((q) => q.status === 'Draft' || q.status === 'Awaiting response')
    .reduce((s, q) => s + quoteTotal(q), 0)
  const wonRate = Math.round(
    (state.quotes.filter((q) => q.status === 'Approved' || q.status === 'Converted').length /
      Math.max(state.quotes.length, 1)) *
      100,
  )
  const jobValue = state.jobs.reduce((s, j) => s + jobTotal(j), 0)
  const labour = state.timeEntries.reduce(
    (s, e) => s + e.hours * (state.employees.find((x) => x.id === e.employeeId)?.hourlyRate ?? 0),
    0,
  )

  // Simple revenue-by-client breakdown from job value.
  const byClient = state.clients
    .map((c) => ({
      name: c.name,
      value: state.jobs.filter((j) => j.clientId === c.id).reduce((s, j) => s + jobTotal(j), 0),
    }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
  const maxVal = Math.max(...byClient.map((r) => r.value), 1)

  return (
    <div>
      <PageHeader title="Reports" subtitle="Business performance overview" />

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Revenue collected</div>
          <div className="stat-value">{eur(paid)}</div>
          <div className="stat-meta up">Paid invoices</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Outstanding</div>
          <div className="stat-value">{eur(outstanding)}</div>
          <div className="stat-meta">Awaiting / overdue</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Open pipeline</div>
          <div className="stat-value">{eur(pipeline)}</div>
          <div className="stat-meta">Draft + awaiting quotes</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Quote win rate</div>
          <div className="stat-value">{wonRate}%</div>
          <div className="stat-meta">Approved / converted</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Scheduled job value</div>
          <div className="stat-value">{eur(jobValue)}</div>
          <div className="stat-meta">All jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Labour cost (wk)</div>
          <div className="stat-value">{eur(labour)}</div>
          <div className="stat-meta">From timesheets</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Job value by client</h3></div>
        <div className="panel-body" style={{ padding: 18 }}>
          {byClient.map((r) => (
            <div key={r.name} className="report-bar-row">
              <span className="report-bar-label">{r.name}</span>
              <div className="report-bar-track">
                <div className="report-bar-fill" style={{ width: `${(r.value / maxVal) * 100}%` }} />
              </div>
              <span className="report-bar-value">{eur(r.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
