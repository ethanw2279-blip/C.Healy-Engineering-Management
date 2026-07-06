import { PageHeader, Button, Avatar, EmptyState } from '../components/ui'
import { useStore, useCurrentUser, formatDate } from '../../data/store'
import { useCreate } from '../useCreate'

export default function Schedule() {
  const { state } = useStore()
  const { can } = useCurrentUser()
  const create = useCreate()

  const jobById = (id: string) => state.jobs.find((j) => j.id === id)
  const empById = (id: string) => state.employees.find((e) => e.id === id)
  const clientName = (jobId: string) => {
    const job = jobById(jobId)
    return state.clients.find((c) => c.id === job?.clientId)?.name ?? 'Unknown'
  }

  // Group visits by date.
  const byDate = state.visits.reduce<Record<string, typeof state.visits>>((acc, v) => {
    ;(acc[v.date] ??= []).push(v)
    return acc
  }, {})
  const dates = Object.keys(byDate).sort()

  return (
    <div>
      <PageHeader
        title="Schedule"
        subtitle="Everyone's visits"
        action={can('create:records') && <Button onClick={() => create('job')}>New job</Button>}
      />

      {dates.length === 0 ? (
        <div className="card"><EmptyState title="Nothing scheduled" hint="Assign a visit to a job to see it here." /></div>
      ) : (
        dates.map((date) => (
          <div key={date} className="sched-day">
            <div className="sched-date">{formatDate(date)}</div>
            <div className="card">
              {byDate[date]
                .sort((a, b) => a.start.localeCompare(b.start))
                .map((v) => {
                  const job = jobById(v.jobId)
                  const emp = empById(v.employeeId)
                  return (
                    <div key={v.id} className="list-row">
                      <div className="sched-time">
                        {v.start}<span>{v.end}</span>
                      </div>
                      <div className="grow">
                        <strong>{job?.title ?? 'Visit'}</strong>
                        <span>{job ? clientName(job.id) : ''}</span>
                      </div>
                      {emp && (
                        <div className="cell-with-avatar">
                          <Avatar name={emp.name} color={emp.color} size={28} />
                          <span className="cell-muted">{emp.name}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
