import { PageHeader, Avatar, StatusBadge } from '../components/ui'
import { useStore, eur } from '../../data/store'

export default function Team() {
  const { state } = useStore()

  const hoursFor = (id: string) =>
    state.timeEntries.filter((t) => t.employeeId === id).reduce((s, t) => s + t.hours, 0)
  const jobsFor = (id: string) =>
    state.jobs.filter((j) => j.assignedTo.includes(id)).length

  return (
    <div>
      <PageHeader title="Team" subtitle={`${state.employees.filter((e) => e.active).length} active members`} />

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Contact</th>
              <th className="num">Rate</th>
              <th className="num">Jobs</th>
              <th className="num">Hours (wk)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {state.employees.map((e) => (
              <tr key={e.id}>
                <td>
                  <div className="cell-with-avatar">
                    <Avatar name={e.name} color={e.color} size={34} />
                    <span className="cell-strong">{e.name}</span>
                  </div>
                </td>
                <td className="cell-muted">{e.role}</td>
                <td>
                  <div className="stack-tight">
                    <span>{e.email}</span>
                    <span className="cell-muted">{e.phone}</span>
                  </div>
                </td>
                <td className="num cell-muted">{e.hourlyRate ? `${eur(e.hourlyRate)}/h` : '—'}</td>
                <td className="num">{jobsFor(e.id)}</td>
                <td className="num cell-strong">{hoursFor(e.id)}h</td>
                <td><StatusBadge status={e.active ? 'Active' : 'Archived'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
