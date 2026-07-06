import { PageHeader, Button, Avatar, StatusBadge } from '../components/ui'
import { CheckIcon } from '../../components/Icons'
import { useStore, useCurrentUser, eur, formatDate, roleNameOf } from '../../data/store'

export default function Timesheets() {
  const { state, dispatch } = useStore()
  const { can } = useCurrentUser()

  const empById = (id: string) => state.employees.find((e) => e.id === id)
  const jobById = (id?: string) => state.jobs.find((j) => j.id === id)

  const entries = [...state.timeEntries].sort((a, b) => (a.date < b.date ? 1 : -1))
  const totalHours = entries.reduce((s, e) => s + e.hours, 0)
  const pending = entries.filter((e) => !e.approved)
  const pendingHours = pending.reduce((s, e) => s + e.hours, 0)
  const labourCost = entries.reduce((s, e) => s + e.hours * (empById(e.employeeId)?.hourlyRate ?? 0), 0)

  // Per-employee rollup.
  const perEmployee = state.employees
    .map((emp) => {
      const es = entries.filter((e) => e.employeeId === emp.id)
      const hours = es.reduce((s, e) => s + e.hours, 0)
      const pend = es.filter((e) => !e.approved).reduce((s, e) => s + e.hours, 0)
      return { emp, hours, pend, pay: hours * emp.hourlyRate }
    })
    .filter((r) => r.hours > 0)

  return (
    <div>
      <PageHeader
        title="Timesheets"
        subtitle="This week · 5 – 11 July 2026"
        action={
          can('approve:timesheets') && (
            <Button onClick={() => dispatch({ type: 'APPROVE_ALL_TIME' })} disabled={pending.length === 0}>
              <CheckIcon size={18} /> Approve all
            </Button>
          )
        }
      />

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total hours logged</div>
          <div className="stat-value">{totalHours}h</div>
          <div className="stat-meta">{perEmployee.length} staff</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending approval</div>
          <div className="stat-value">{pendingHours}h</div>
          <div className="stat-meta">{pending.length} entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Estimated labour cost</div>
          <div className="stat-value">{eur(labourCost)}</div>
          <div className="stat-meta">based on hourly rates</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <div className="panel-head"><h3>Hours by employee</h3></div>
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th className="num">Rate</th>
              <th className="num">Hours</th>
              <th className="num">Pending</th>
              <th className="num">Est. pay</th>
            </tr>
          </thead>
          <tbody>
            {perEmployee.map(({ emp, hours, pend, pay }) => (
              <tr key={emp.id}>
                <td>
                  <div className="cell-with-avatar">
                    <Avatar name={emp.name} color={emp.color} size={30} />
                    <span className="cell-strong">{emp.name}</span>
                  </div>
                </td>
                <td className="cell-muted">{roleNameOf(state, emp.roleId)}</td>
                <td className="num cell-muted">{emp.hourlyRate ? `${eur(emp.hourlyRate)}/h` : '—'}</td>
                <td className="num cell-strong">{hours}h</td>
                <td className="num">{pend > 0 ? <span className="badge badge-amber">{pend}h</span> : <span className="cell-muted">0</span>}</td>
                <td className="num cell-strong">{eur(pay)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="panel-head"><h3>Time entries</h3></div>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee</th>
              <th>Job</th>
              <th>Note</th>
              <th className="num">Hours</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const emp = empById(e.employeeId)
              const job = jobById(e.jobId)
              return (
                <tr key={e.id}>
                  <td className="cell-muted">{formatDate(e.date)}</td>
                  <td>
                    <div className="cell-with-avatar">
                      <Avatar name={emp?.name ?? '?'} color={emp?.color} size={26} />
                      {emp?.name}
                    </div>
                  </td>
                  <td className="cell-muted">{job ? `${job.number}` : 'General'}</td>
                  <td className="cell-muted">{e.note ?? '—'}</td>
                  <td className="num cell-strong">{e.hours}h</td>
                  <td>
                    <StatusBadge status={e.approved ? 'Approved' : 'Pending'} />
                  </td>
                  <td className="num">
                    {!e.approved && can('approve:timesheets') && (
                      <Button size="sm" variant="secondary" onClick={() => dispatch({ type: 'APPROVE_TIME', id: e.id })}>
                        Approve
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
