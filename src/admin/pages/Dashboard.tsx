import { Link } from 'react-router-dom'
import { PageHeader, StatusBadge, Avatar, Button } from '../components/ui'
import { useStore, useCurrentUser, eur, quoteTotal, invoiceTotal, formatDateShort } from '../../data/store'
import { useCreate } from '../useCreate'
import { COMPANY } from '../../data/company'

const today = new Date().toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export default function Dashboard() {
  const { state } = useStore()
  const { can } = useCurrentUser()
  const create = useCreate()

  const clientById = (id: string) => state.clients.find((c) => c.id === id)?.name ?? 'Unknown'

  const quotesAwaiting = state.quotes.filter((q) => q.status === 'Awaiting response')
  const outstanding = state.invoices
    .filter((i) => i.status === 'Awaiting payment' || i.status === 'Past due')
    .reduce((s, i) => s + invoiceTotal(i), 0)
  const activeJobs = state.jobs.filter((j) => j.status === 'Active' || j.status === 'Scheduled').length
  const weekHours = state.timeEntries.reduce((s, t) => s + t.hours, 0)
  const quotedValue = state.quotes.reduce((s, q) => s + quoteTotal(q), 0)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`${today} · ${COMPANY.name}`}
        action={can('create:records') && <Button onClick={() => create('quote')}>Create quote</Button>}
      />

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Outstanding invoices</div>
          <div className="stat-value">{eur(outstanding)}</div>
          <div className="stat-meta">{state.invoices.filter((i) => i.status !== 'Paid').length} unpaid</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Quoted value (pipeline)</div>
          <div className="stat-value">{eur(quotedValue)}</div>
          <div className="stat-meta up">{quotesAwaiting.length} awaiting response</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active jobs</div>
          <div className="stat-value">{activeJobs}</div>
          <div className="stat-meta">{state.jobs.length} total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Team hours this week</div>
          <div className="stat-value">{weekHours}h</div>
          <div className="stat-meta">{state.employees.filter((e) => e.active).length} active staff</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="panel">
          <div className="panel-head">
            <h3>Recent quotes</h3>
            <Link className="link" to="/quotes">View all</Link>
          </div>
          <div className="panel-body">
            {state.quotes.slice(0, 5).map((q) => (
              <div key={q.id} className="list-row">
                <div className="grow">
                  <strong>{q.number} · {q.title}</strong>
                  <span>{clientById(q.clientId)}</span>
                </div>
                <span className="cell-strong">{eur(quoteTotal(q))}</span>
                <StatusBadge status={q.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Upcoming jobs</h3>
            <Link className="link" to="/jobs">View all</Link>
          </div>
          <div className="panel-body">
            {state.jobs
              .filter((j) => j.status === 'Scheduled' || j.status === 'Active')
              .map((j) => (
                <div key={j.id} className="list-row">
                  <div className="grow">
                    <strong>{j.title}</strong>
                    <span>{clientById(j.clientId)} · {formatDateShort(j.startDate)}</span>
                  </div>
                  <div className="cell-with-avatar">
                    {j.assignedTo.map((id) => {
                      const e = state.employees.find((x) => x.id === id)
                      return e ? <Avatar key={id} name={e.name} color={e.color} size={26} /> : null
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
