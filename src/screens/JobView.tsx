import { useParams, useNavigate } from 'react-router-dom'
import { CheckIcon, ClockIcon } from '../components/Icons'
import { useStore, useCurrentUser, eur, jobTotal } from '../data/store'
import { fmtDayShort } from '../mobile/fieldHelpers'
import FieldPhotos from './FieldPhotos'
import './screens.css'
import './field.css'
import './JobView.css'

export default function JobView() {
  const { id } = useParams()
  const nav = useNavigate()
  const { state, dispatch } = useStore()
  const { can, user } = useCurrentUser()

  const job = state.jobs.find((j) => j.id === id)
  if (!job) {
    return (
      <div>
        <div className="fld-topbar"><button className="fld-back" onClick={() => nav(-1)}>←</button><span>Job</span></div>
        <div className="placeholder"><h2>Job not found</h2></div>
      </div>
    )
  }

  const client = state.clients.find((c) => c.id === job.clientId)
  const visits = state.visits.filter((v) => v.jobId === job.id).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
  const complete = job.status === 'Complete'
  const canUpdate = can('create:records') || job.assignedTo.includes(user?.id ?? '')

  const markComplete = () => {
    dispatch({ type: 'UPDATE_JOB', job: { ...job, status: 'Complete' } })
  }

  return (
    <div>
      <div className="fld-topbar">
        <button className="fld-back" onClick={() => nav(-1)}>←</button>
        <span>{job.number}</span>
      </div>

      <div className="pad">
        <h1 className="fld-job-title">{job.title}</h1>
        <div className="fld-job-status">
          <span className={`badge badge-${complete ? 'green' : 'amber'}`}>{job.status}</span>
          <span className="fld-job-value">{eur(jobTotal(job))}</span>
        </div>

        <div className="fld-card">
          <div className="fld-row"><span>Client</span><strong>{client?.name ?? '—'}</strong></div>
          {client?.address && <div className="fld-row"><span>Address</span><strong>{client.address}</strong></div>}
          {client?.phone && <div className="fld-row"><span>Phone</span><strong><a href={`tel:${client.phone}`}>{client.phone}</a></strong></div>}
        </div>

        {job.items.length > 0 && (
          <>
            <h3 className="fld-h3">Work</h3>
            <div className="fld-card">
              {job.items.map((it) => (
                <div key={it.id} className="fld-row"><span>{it.name}</span><strong>{it.qty} × {eur(it.unitPrice)}</strong></div>
              ))}
            </div>
          </>
        )}

        <h3 className="fld-h3">Visits</h3>
        {visits.length === 0 ? (
          <p className="muted-sub">No visits scheduled.</p>
        ) : (
          <div className="fld-card">
            {visits.map((v) => (
              <div key={v.id} className="fld-row">
                <span><ClockIcon size={16} /> {fmtDayShort(v.date)}</span>
                <strong>{v.start} – {v.end}</strong>
              </div>
            ))}
          </div>
        )}

        <h3 className="fld-h3">Photos</h3>
        <FieldPhotos entityType="job" entityId={job.id} />

        {canUpdate && !complete && (
          <button className="fld-complete" onClick={markComplete}>
            <CheckIcon size={20} /> Mark job complete
          </button>
        )}
        {complete && <div className="fld-done"><CheckIcon size={18} /> Job complete</div>}
      </div>
    </div>
  )
}
