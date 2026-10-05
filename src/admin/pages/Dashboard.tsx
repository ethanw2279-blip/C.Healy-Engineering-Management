import { Link, useNavigate } from 'react-router-dom'
import { PageHeader, StatusBadge, Avatar, Button } from '../components/ui'
import { useStore, useCurrentUser, eur, quoteTotal, invoiceTotal, formatDateShort } from '../../data/store'
import { useCreate } from '../useCreate'
import { NAV } from '../nav'
import { BriefcaseIcon } from '../../components/Icons'
import { greeting, firstName, todayISO, weekDatesISO } from '../../mobile/fieldHelpers'
import { COMPANY } from '../../data/company'
import type { Visit } from '../../data/types'

const todayLong = new Date().toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

export default function Dashboard() {
  const { state } = useStore()
  const { user, can } = useCurrentUser()
  const create = useCreate()
  const nav = useNavigate()

  const clientById = (id?: string) => state.clients.find((c) => c.id === id)
  const today = todayISO()
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const nowHM = hhmm(new Date())
  const dayLabel = (iso: string) => (iso === today ? 'Today' : iso === tomorrow ? 'Tomorrow' : formatDateShort(iso))

  // Team-wide schedule from now on: the visit under way, then everything after it.
  const describe = (v: Visit) => {
    const job = v.jobId ? state.jobs.find((j) => j.id === v.jobId) : undefined
    const client = clientById(job?.clientId)
    return {
      ...v,
      job,
      title: job?.title ?? v.title ?? v.category ?? 'Visit',
      client: client?.name ?? '',
      address: client?.address ?? '',
      employee: state.employees.find((e) => e.id === v.employeeId),
    }
  }
  const upcoming = state.visits
    .filter((v) => v.date > today || (v.date === today && v.end > nowHM))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    .map(describe)
  const [next, ...later] = upcoming
  const nextIsNow = !!next && next.date === today && next.start <= nowHM

  const openJobs = state.jobs.filter((j) => j.status !== 'Complete')
  const activeJobs = state.jobs.filter((j) => j.status === 'Active')
  const quotesAwaiting = state.quotes.filter((q) => q.status === 'Awaiting response')
  const unpaid = state.invoices
    .filter((i) => i.status === 'Awaiting payment' || i.status === 'Past due')
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn))
  const outstanding = unpaid.reduce((s, i) => s + invoiceTotal(i), 0)
  const overdue = unpaid.filter((i) => i.status === 'Past due' || (i.dueOn && i.dueOn < today))
  const week = weekDatesISO()
  const weekHours = state.timeEntries.filter((t) => week.includes(t.date)).reduce((s, t) => s + t.hours, 0)
  const toApprove = state.timeEntries.filter((t) => !t.approved).length

  // Shortcut buttons: jobs first, then every page in the sidebar the user can open.
  const counts: Record<string, number> = {
    '/schedule': state.visits.filter((v) => v.date === today).length,
    '/clients': state.clients.filter((c) => c.status !== 'Archived').length,
    '/requests': state.requests.filter((r) => r.status === 'New').length,
    '/quotes': quotesAwaiting.length,
    '/invoices': unpaid.length,
    '/shop/orders': state.orders.filter((o) => o.status === 'New').length,
    '/timesheets': toApprove,
  }
  const hints: Record<string, string> = {
    '/schedule': 'visits today',
    '/clients': 'clients',
    '/requests': 'new',
    '/quotes': 'awaiting reply',
    '/invoices': 'unpaid',
    '/shop/orders': 'new',
    '/timesheets': 'to approve',
  }
  const shortcuts = [
    ...(can('view:jobs')
      ? [
          { to: '/jobs?status=Active', label: 'Current jobs', Icon: BriefcaseIcon, count: activeJobs.length, hint: 'in progress' },
          { to: '/jobs', label: 'All jobs', Icon: BriefcaseIcon, count: openJobs.length, hint: 'open' },
        ]
      : []),
    ...NAV.filter((n) => n.to !== '/' && n.to !== '/jobs' && can(n.perm)).map((n) => ({
      to: n.to,
      label: n.label,
      Icon: n.Icon,
      count: counts[n.to] as number | undefined,
      hint: hints[n.to],
    })),
  ]

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${firstName(user?.name) || 'there'}`}
        subtitle={`${todayLong} · ${COMPANY.name}`}
        action={can('create:records') && <Button onClick={() => create('quote')}>Create quote</Button>}
      />

      {/* Next scheduled job and what follows it: the first thing on the page */}
      <div className="dash-top">
        {next ? (
          <div className="dash-next">
            <div className="dash-next-head">
              <span className={`dash-next-tag ${nextIsNow ? 'now' : ''}`}>{nextIsNow ? 'On now' : 'Next scheduled job'}</span>
              <span className="dash-next-time">{dayLabel(next.date)} · {next.start} – {next.end}</span>
            </div>
            <h2 className="dash-next-title">{next.title}</h2>
            <p className="dash-next-where">{[next.client, next.address].filter(Boolean).join(' · ') || next.category || 'No location'}</p>
            <div className="dash-next-foot">
              {next.employee && (
                <span className="dash-next-crew">
                  <Avatar name={next.employee.name} color={next.employee.color} size={28} />
                  {next.employee.name}
                </span>
              )}
              {next.job && <Button variant="secondary" onClick={() => nav(`/jobs/${next.job!.id}`)}>Open job</Button>}
            </div>
          </div>
        ) : (
          <div className="dash-next empty">
            <span className="dash-next-tag">Next scheduled job</span>
            <h2 className="dash-next-title">Nothing scheduled</h2>
            <p className="dash-next-where">No upcoming visits on the schedule.</p>
          </div>
        )}

        <div className="panel">
          <div className="panel-head">
            <h3>Coming up</h3>
            {can('view:schedule') && <Link className="link" to="/schedule">Schedule</Link>}
          </div>
          <div className="panel-body">
            {later.length === 0 && <div className="list-row"><span className="cell-muted">Nothing else scheduled.</span></div>}
            {later.slice(0, 5).map((v) => (
              <div
                key={v.id}
                className={`list-row ${v.job ? 'clickable' : ''}`}
                onClick={() => v.job && nav(`/jobs/${v.job.id}`)}
              >
                <div className="dash-when">
                  <strong>{v.start}</strong>
                  <span>{dayLabel(v.date)}</span>
                </div>
                <div className="grow">
                  <strong>{v.title}</strong>
                  <span>{v.client || v.category}</span>
                </div>
                {v.employee && <Avatar name={v.employee.name} color={v.employee.color} size={26} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shortcuts */}
      <h3 className="dash-section">Shortcuts</h3>
      <div className="dash-shortcuts">
        {shortcuts.map(({ to, label, Icon, count, hint }) => (
          <Link key={to} to={to} className="dash-shortcut">
            <span className="dash-shortcut-icon"><Icon size={20} /></span>
            <span className="dash-shortcut-text">
              <strong>{label}</strong>
              {count != null && <span>{count} {hint}</span>}
            </span>
          </Link>
        ))}
      </div>

      {/* Key numbers */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Outstanding invoices</div>
          <div className="stat-value">{eur(outstanding)}</div>
          <div className={`stat-meta ${overdue.length ? 'warn' : ''}`}>
            {overdue.length ? `${overdue.length} overdue` : `${unpaid.length} unpaid`}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Quotes awaiting reply</div>
          <div className="stat-value">{eur(quotesAwaiting.reduce((s, q) => s + quoteTotal(q), 0))}</div>
          <div className="stat-meta up">{quotesAwaiting.length} awaiting response</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active jobs</div>
          <div className="stat-value">{activeJobs.length}</div>
          <div className="stat-meta">{openJobs.length} open in total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Team hours this week</div>
          <div className="stat-value">{weekHours.toFixed(1)}h</div>
          <div className="stat-meta">{toApprove} entries to approve</div>
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
              <div key={q.id} className="list-row clickable" onClick={() => nav(`/quotes/${q.id}`)}>
                <div className="grow">
                  <strong>{q.number} · {q.title}</strong>
                  <span>{clientById(q.clientId)?.name ?? 'Unknown'}</span>
                </div>
                <span className="cell-strong">{eur(quoteTotal(q))}</span>
                <StatusBadge status={q.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Money owed</h3>
            <Link className="link" to="/invoices">View all</Link>
          </div>
          <div className="panel-body">
            {unpaid.length === 0 && <div className="list-row"><span className="cell-muted">All invoices are paid.</span></div>}
            {unpaid.slice(0, 5).map((i) => (
              <div key={i.id} className="list-row clickable" onClick={() => nav(`/invoices/${i.id}`)}>
                <div className="grow">
                  <strong>{i.number} · {clientById(i.clientId)?.name ?? 'Unknown'}</strong>
                  <span>Due {formatDateShort(i.dueOn)}</span>
                </div>
                <span className="cell-strong">{eur(invoiceTotal(i))}</span>
                <StatusBadge status={i.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
