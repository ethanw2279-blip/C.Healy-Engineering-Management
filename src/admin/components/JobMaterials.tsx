import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './ui'
import { CheckIcon, PlusIcon } from '../../components/Icons'
import { useStore, useCurrentUser } from '../../data/store'
import type { JobMaterial } from '../../data/types'
import { countOf, fmtQty, locationName, markUnused, markUsed, MATERIAL_LABEL, MATERIAL_TONE, runAll } from '../../data/stock'
import MaterialSheet from '../../screens/MaterialSheet'
import '../../components/stock.css'

// The Materials section on the office job page.
export default function JobMaterials({ jobId }: { jobId: string }) {
  const { state, dispatch } = useStore()
  const { user, can } = useCurrentUser()
  const [modal, setModal] = useState<{ material?: JobMaterial } | null>(null)

  if (!can('view:stock') && !can('create:records')) return null
  const materials = state.jobMaterials.filter((m) => m.jobId === jobId)

  const comesFrom = (m: JobMaterial) => {
    if (m.status === 'from_stock' && m.itemId && m.locationId)
      return `${locationName(state, m.locationId)} · ${fmtQty(countOf(state, m.itemId, m.locationId))} available`
    if (m.status === 'to_buy') return <>On the <Link to="/stock">shopping list</Link></>
    if (m.status === 'got') return 'Bought for this job'
    if (m.locationId) return `Taken from ${locationName(state, m.locationId)}`
    return '—'
  }

  return (
    <div className="detail-section">
      <div className="detail-section-title">
        <span>Materials ({materials.length})</span>
        <Button variant="secondary" size="sm" onClick={() => setModal({})}><PlusIcon size={14} /> Add material</Button>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th style={{ width: 44 }} /><th>Material</th><th className="num">Qty</th><th>Comes from</th><th>Status</th></tr></thead>
          <tbody>
            {materials.length === 0 && <tr><td colSpan={5} className="cell-muted">No materials yet. Add what's needed and anything not in stock goes on the shopping list.</td></tr>}
            {materials.map((m) => (
              <tr key={m.id} className={`clickable ${m.status === 'used' ? 'stk-done' : ''}`} onClick={() => setModal({ material: m })}>
                <td>
                  <button
                    className={`stk-tick ${m.status === 'used' ? 'on' : ''}`}
                    aria-label={m.status === 'used' ? 'Mark as not used' : 'Mark as used'}
                    disabled={m.status === 'to_buy'}
                    onClick={(e) => { e.stopPropagation(); runAll(dispatch, m.status === 'used' ? markUnused(m, user?.id) : markUsed(m, user?.id)) }}
                  >
                    {m.status === 'used' && <CheckIcon size={14} />}
                  </button>
                </td>
                <td className="cell-strong" style={m.status === 'used' ? { textDecoration: 'line-through', color: 'var(--text-faint)' } : undefined}>{m.name}</td>
                <td className="num">{fmtQty(m.qty, m.unit)}</td>
                <td className="cell-muted">{comesFrom(m)}</td>
                <td><span className={`stk-pill stk-${MATERIAL_TONE[m.status]}`}>{MATERIAL_LABEL[m.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && <MaterialSheet inModal jobId={jobId} material={modal.material} onClose={() => setModal(null)} />}
    </div>
  )
}
