import { useNavigate } from 'react-router-dom'
import { useStore } from '../data/store'
import './screens.css'
import './field.css'

export default function FieldClients() {
  const { state } = useStore()
  const nav = useNavigate()
  const clients = state.clients.filter((c) => c.status === 'Active')

  return (
    <div>
      <div className="fld-topbar">
        <div className="fld-topbar-left">
          <button className="fld-back" onClick={() => nav(-1)}>←</button>
          <span>All clients</span>
        </div>
        <span className="cell-muted" style={{ fontWeight: 600, color: 'var(--navy-muted)' }}>{clients.length}</span>
      </div>

      <div className="pad">
        {clients.length === 0 ? (
          <p className="muted-sub">No active clients.</p>
        ) : (
          <div className="fld-card">
            {clients.map((c) => (
              <div key={c.id} className="fld-listrow">
                <div className="fld-listrow-body">
                  <strong>{c.name}</strong>
                  <span>{c.company || c.address || c.email}</span>
                </div>
                {c.phone && <a className="fld-call" href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()}>Call</a>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
