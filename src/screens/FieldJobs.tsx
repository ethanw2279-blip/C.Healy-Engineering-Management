import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore, useCurrentUser, eur, jobTotal } from '../data/store'
import type { Job } from '../data/types'
import './screens.css'
import './field.css'

const toneFor: Record<string, string> = {
  Active: 'green', Scheduled: 'amber', 'Requires invoicing': 'amber', Unscheduled: 'grey',
}

// ?view=current → jobs in progress, ?view=mine → open jobs assigned to me,
// otherwise every open job.
const VIEWS: Record<string, { title: string; empty: string }> = {
  all: { title: 'All jobs', empty: 'No open jobs.' },
  current: { title: 'Current jobs', empty: 'No jobs in progress.' },
  mine: { title: 'My jobs', empty: 'No open jobs assigned to you.' },
}

export default function FieldJobs() {
  const { state } = useStore()
  const { user } = useCurrentUser()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const view = VIEWS[params.get('view') ?? ''] ? params.get('view')! : 'all'
  const clientName = (id: string) => state.clients.find((c) => c.id === id)?.name ?? ''
  const matches = (j: Job) =>
    view === 'current' ? j.status === 'Active'
      : view === 'mine' ? j.status !== 'Complete' && !!user && j.assignedTo.includes(user.id)
        : j.status !== 'Complete'
  const jobs = state.jobs.filter(matches)

  return (
    <div>
      <div className="fld-topbar">
        <div className="fld-topbar-left">
          <button className="fld-back" onClick={() => nav(-1)}>←</button>
          <span>{VIEWS[view].title}</span>
        </div>
        <span style={{ fontWeight: 600, color: 'var(--navy-muted)' }}>{jobs.length}</span>
      </div>

      <div className="pad">
        {jobs.length === 0 ? (
          <p className="muted-sub">{VIEWS[view].empty}</p>
        ) : (
          <div className="fld-card">
            {jobs.map((j) => (
              <div key={j.id} className="fld-listrow" onClick={() => nav(`/field/job/${j.id}`)}>
                <div className="fld-listrow-body">
                  <strong>{j.number} · {j.title}</strong>
                  <span>{clientName(j.clientId)}</span>
                </div>
                <span className={`badge badge-${toneFor[j.status] ?? 'grey'}`}>{j.status}</span>
                <strong style={{ color: 'var(--navy)' }}>{eur(jobTotal(j))}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
