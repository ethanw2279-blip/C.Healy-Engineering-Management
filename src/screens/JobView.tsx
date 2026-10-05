import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { CameraIcon, CheckIcon, ClockIcon, FileIcon, ListIcon, MapPinIcon } from '../components/Icons'
import { useStore, useCurrentUser, eur, jobTotal } from '../data/store'
import { fmtDayShort } from '../mobile/fieldHelpers'
import FieldPhotos, { isImage } from './FieldPhotos'
import FieldFiles from './FieldFiles'
import './screens.css'
import './field.css'
import './JobView.css'

// Sections of the job page, shown as tabs under the job header. The chosen
// tab is kept in the URL (?tab=photos) so back/forward and refresh keep it.
// A Materials section slots in here as another entry when it's built.
const SECTIONS = [
  { key: 'details', label: 'Details', icon: ListIcon },
  { key: 'photos', label: 'Photos', icon: CameraIcon },
  { key: 'files', label: 'Files', icon: FileIcon },
  { key: 'directions', label: 'Directions', icon: MapPinIcon },
] as const
type SectionKey = (typeof SECTIONS)[number]['key']

const mapLinks = (address: string) => {
  const q = encodeURIComponent(address)
  return [
    { key: 'google', label: 'Google Maps', href: `https://www.google.com/maps/dir/?api=1&destination=${q}` },
    { key: 'waze', label: 'Waze', href: `https://waze.com/ul?q=${q}&navigate=yes` },
    { key: 'apple', label: 'Apple Maps', href: `https://maps.apple.com/?daddr=${q}` },
  ]
}

export default function JobView() {
  const { id } = useParams()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
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

  const section: SectionKey = SECTIONS.some((t) => t.key === params.get('tab')) ? (params.get('tab') as SectionKey) : 'details'
  const pick = (key: SectionKey) => setParams(key === 'details' ? {} : { tab: key }, { replace: true })

  const jobFiles = state.attachments.filter((a) => a.entityType === 'job' && a.entityId === job.id)
  const photoCount = jobFiles.filter((a) => isImage(a.fileName)).length
  const counts: Partial<Record<SectionKey, number>> = { photos: photoCount, files: jobFiles.length - photoCount }

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

        <div className="jv-tabs" role="tablist">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              role="tab"
              aria-selected={section === key}
              className={`jv-tab${section === key ? ' active' : ''}`}
              onClick={() => pick(key)}
            >
              <Icon size={20} />
              <span>{label}</span>
              {!!counts[key] && <em className="jv-count">{counts[key]}</em>}
            </button>
          ))}
        </div>

        {section === 'details' && (
          <>
            <div className="fld-card">
              <div className="fld-row"><span>Client</span><strong>{client?.name ?? '—'}</strong></div>
              {client?.address && (
                <button className="fld-row jv-row-link" onClick={() => pick('directions')}>
                  <span>Address</span><strong>{client.address}</strong>
                </button>
              )}
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

            {canUpdate && !complete && (
              <button className="fld-complete" onClick={markComplete}>
                <CheckIcon size={20} /> Mark job complete
              </button>
            )}
            {complete && <div className="fld-done"><CheckIcon size={18} /> Job complete</div>}
          </>
        )}

        {section === 'photos' && <FieldPhotos entityType="job" entityId={job.id} imagesOnly />}

        {section === 'files' && <FieldFiles entityId={job.id} />}

        {section === 'directions' && (
          client?.address ? (
            <>
              <div className="fld-card jv-address">
                <MapPinIcon size={22} />
                <div>
                  <strong>{client.name}</strong>
                  <span>{client.address}</span>
                </div>
              </div>
              <p className="muted-sub jv-hint">Tap an app to start directions.</p>
              <div className="jv-maps">
                {mapLinks(client.address).map((m) => (
                  <a key={m.key} className={`jv-map jv-map-${m.key}`} href={m.href} target="_blank" rel="noreferrer">
                    <span className="jv-map-dot" />
                    {m.label}
                  </a>
                ))}
              </div>
            </>
          ) : (
            <p className="muted-sub">This client has no address yet. Add one in the office app to get directions.</p>
          )
        )}
      </div>
    </div>
  )
}
