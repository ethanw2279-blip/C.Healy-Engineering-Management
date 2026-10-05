import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckIcon, PlusIcon } from '../components/Icons'
import { useStore, useCurrentUser } from '../data/store'
import type { JobMaterial } from '../data/types'
import { countOf, fmtQty, locationName, markUnused, markUsed, MATERIAL_LABEL, MATERIAL_TONE, runAll } from '../data/stock'
import MaterialSheet from './MaterialSheet'
import './JobView.css'
import '../components/stock.css'

// The Materials section of a job in the field app: what's needed, where it's
// coming from, and a tick for when it's used. Self-contained so it can sit in
// the job page as a section or a tab.
export default function JobMaterials({ jobId, showHeading = true }: { jobId: string; showHeading?: boolean }) {
  const { state, dispatch } = useStore()
  const { user, can } = useCurrentUser()
  const nav = useNavigate()
  const [sheet, setSheet] = useState<{ material?: JobMaterial } | null>(null)

  if (!can('view:stock') && !can('create:records')) return null
  const materials = state.jobMaterials.filter((m) => m.jobId === jobId)

  const note = (m: JobMaterial) => {
    if (m.status === 'from_stock' && m.itemId && m.locationId)
      return `${locationName(state, m.locationId)} · ${fmtQty(countOf(state, m.itemId, m.locationId))} available`
    if (m.status === 'to_buy') return 'On the shopping list'
    if (m.status === 'got') return 'Bought for this job'
    if (m.status === 'used' && m.locationId) return `Taken from ${locationName(state, m.locationId)}`
    return 'Used'
  }

  const toggle = (m: JobMaterial) =>
    runAll(dispatch, m.status === 'used' ? markUnused(m, user?.id) : markUsed(m, user?.id))

  return (
    <>
      {showHeading && (
        <h3 className="fld-h3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span>Materials</span>
          <button className="link" style={{ fontSize: 14 }} onClick={() => nav('/field/shopping')}>Shopping list</button>
        </h3>
      )}
      <div className="fld-card">
        {materials.map((m) => (
          <div key={m.id} className={`stk-row ${m.status === 'used' ? 'stk-done' : ''}`}>
            <button
              className={`stk-tick ${m.status === 'used' ? 'on' : ''}`}
              aria-label={m.status === 'used' ? 'Mark as not used' : 'Mark as used'}
              disabled={m.status === 'to_buy'}
              onClick={() => toggle(m)}
            >
              {m.status === 'used' && <CheckIcon size={14} />}
            </button>
            <button className="stk-body" style={{ textAlign: 'left' }} onClick={() => setSheet({ material: m })}>
              <strong>{m.name}</strong>
              <span>{fmtQty(m.qty, m.unit)} · {note(m)}</span>
            </button>
            <span className={`stk-pill stk-${MATERIAL_TONE[m.status]}`}>{MATERIAL_LABEL[m.status]}</span>
          </div>
        ))}
        <button className="stk-add" onClick={() => setSheet({})}><PlusIcon size={18} /> Add material</button>
      </div>
      {sheet && <MaterialSheet jobId={jobId} material={sheet.material} onClose={() => setSheet(null)} />}
    </>
  )
}
