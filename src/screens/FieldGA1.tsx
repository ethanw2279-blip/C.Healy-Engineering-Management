import { useNavigate } from 'react-router-dom'
import { useStore, useCurrentUser, formatDate } from '../data/store'
import { RESULT_LABELS, resultTone } from '../data/ga1'
import './screens.css'
import './field.css'

export default function FieldGA1() {
  const { state } = useStore()
  const { can } = useCurrentUser()
  const nav = useNavigate()
  const clientName = (id: string) => state.clients.find((c) => c.id === id)?.name ?? ''

  if (!can('view:ga1')) {
    return (
      <div>
        <div className="fld-topbar"><div className="fld-topbar-left"><button className="fld-back" onClick={() => nav(-1)}>←</button><span>GA1 Inspections</span></div></div>
        <div className="pad"><p className="muted-sub">You don&apos;t have access to GA1 Inspections.</p></div>
      </div>
    )
  }

  return (
    <div>
      <div className="fld-topbar">
        <div className="fld-topbar-left">
          <button className="fld-back" onClick={() => nav(-1)}>←</button>
          <span>GA1 Inspections</span>
        </div>
        <button className="fld-topbar-btn" onClick={() => nav('/field/ga1/new')}>+ New</button>
      </div>

      <div className="pad">
        {state.ga1.length === 0 ? (
          <p className="muted-sub">No inspections yet. Tap “New” to create one.</p>
        ) : (
          <div className="fld-card">
            {state.ga1.map((g) => (
              <div key={g.id} className="fld-listrow" onClick={() => nav(`/field/ga1/${g.id}`)}>
                <div className="fld-listrow-body">
                  <strong>{g.reportNumber} · {g.equipmentType || 'Equipment'}</strong>
                  <span>{clientName(g.clientId)} · {formatDate(g.examinationDate)}</span>
                </div>
                <span className={`badge badge-${resultTone[g.overallResult]}`}>{RESULT_LABELS[g.overallResult]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
