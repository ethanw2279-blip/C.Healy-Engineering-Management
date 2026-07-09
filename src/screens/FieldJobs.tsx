import { useNavigate } from 'react-router-dom'
import { useStore, eur, jobTotal } from '../data/store'
import './screens.css'
import './field.css'

const toneFor: Record<string, string> = {
  Active: 'green', Scheduled: 'amber', 'Requires invoicing': 'amber', Unscheduled: 'grey',
}

export default function FieldJobs() {
  const { state } = useStore()
  const nav = useNavigate()
  const clientName = (id: string) => state.clients.find((c) => c.id === id)?.name ?? ''
  const jobs = state.jobs.filter((j) => j.status !== 'Complete')

  return (
    <div>
      <div className="fld-topbar">
        <div className="fld-topbar-left">
          <button className="fld-back" onClick={() => nav(-1)}>←</button>
          <span>All jobs</span>
        </div>
        <span style={{ fontWeight: 600, color: 'var(--navy-muted)' }}>{jobs.length}</span>
      </div>

      <div className="pad">
        {jobs.length === 0 ? (
          <p className="muted-sub">No open jobs.</p>
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
