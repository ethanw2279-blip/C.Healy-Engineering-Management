import { useMemo, useState } from 'react'
import { SearchIcon } from '../components/Icons'
import SheetOrModal from '../components/SheetOrModal'
import { useStore, useCurrentUser, newId } from '../data/store'
import type { JobMaterial, MaterialStatus } from '../data/types'
import {
  countOf, fmtNum, levelStatus, levelOf, locationName, markUnused, markUsed, runAll, sortedLocations, suggestSource,
  STATUS_LABEL, STATUS_TONE, whereSummary,
} from '../data/stock'
import './field.css'
import '../components/stock.css'

// Add a material to a job (search stock or type a one-off), or edit one.
// The office app shows the same form in its modal (`inModal`).
export default function MaterialSheet({ jobId, material, onClose, inModal }: { jobId: string; material?: JobMaterial; onClose: () => void; inModal?: boolean }) {
  const { state, dispatch } = useStore()
  const { user } = useCurrentUser()
  const editing = !!material

  const [query, setQuery] = useState(material?.name ?? '')
  const [itemId, setItemId] = useState<string | undefined>(material?.itemId)
  const [qty, setQty] = useState(material?.qty ?? 1)
  const [unit, setUnit] = useState(material?.unit ?? 'each')
  const [source, setSource] = useState<{ status: MaterialStatus; locationId?: string } | undefined>(
    material ? { status: material.status, locationId: material.locationId } : undefined,
  )

  const locations = sortedLocations(state)
  const item = state.stockItems.find((i) => i.id === itemId)
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const active = state.stockItems.filter((i) => i.active)
    return (q ? active.filter((i) => i.name.toLowerCase().includes(q)) : active).slice(0, 8)
  }, [query, state.stockItems])

  // Until the person picks a source themselves, follow the suggestion.
  const suggested = suggestSource(state, itemId, qty)
  const chosen = source ?? suggested
  const fromLoc = chosen.status === 'from_stock' ? chosen.locationId : undefined
  const available = itemId && fromLoc ? countOf(state, itemId, fromLoc) : 0

  const pick = (id: string) => {
    const it = state.stockItems.find((i) => i.id === id)
    setItemId(id)
    setQuery(it?.name ?? '')
    setUnit(it?.unit ?? 'each')
    setSource(undefined)
  }

  const name = (item?.name ?? query).trim()
  const valid = name.length > 0 && qty > 0 && (chosen.status !== 'from_stock' || !!fromLoc)

  const save = () => {
    if (!valid) return
    const next: JobMaterial = {
      id: material?.id ?? newId('jm'),
      jobId,
      itemId,
      name,
      unit: item?.unit ?? unit,
      qty,
      status: chosen.status,
      locationId: chosen.status === 'from_stock' ? fromLoc : undefined,
      addedBy: material?.addedBy ?? user?.id,
      createdAt: material?.createdAt ?? new Date().toISOString(),
    }
    if (!editing) {
      dispatch({ type: 'ADD_JOB_MATERIAL', material: next })
    } else if (material.status === 'used') {
      // A used material's stock already came off: put the old amount back, take the new one.
      runAll(dispatch, markUnused(material, user?.id))
      const fromStock = !!(next.itemId && material.locationId)
      runAll(dispatch, markUsed({ ...next, status: fromStock ? 'from_stock' : 'got', locationId: fromStock ? material.locationId : undefined }, user?.id))
    } else {
      dispatch({ type: 'UPDATE_JOB_MATERIAL', material: next })
    }
    onClose()
  }

  const remove = () => {
    if (!material) return
    if (material.status === 'used') runAll(dispatch, markUnused(material, user?.id))
    dispatch({ type: 'REMOVE_JOB_MATERIAL', id: material.id })
    onClose()
  }

  const title = editing ? 'Edit material' : 'Add material'
  const body = (
    <>

        <div className="fld-form-field">
          <label>What's needed?</label>
          <div style={{ position: 'relative' }}>
            <input
              autoFocus={!editing}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setItemId(undefined); setSource(undefined) }}
              placeholder="Search stock or type a one-off item"
              style={{ paddingLeft: 38, width: '100%' }}
            />
            <span style={{ position: 'absolute', left: 12, top: 13, color: 'var(--navy-muted)' }}><SearchIcon size={18} /></span>
          </div>
        </div>

        {!itemId && (
          <div className="stk-pick">
            {matches.map((i) => {
              const sts = locations.map((l) => levelStatus(levelOf(state, i.id, l.id)))
              const worst = sts.includes('out') ? 'out' : sts.includes('low') ? 'low' : undefined
              return (
                <button key={i.id} className="stk-row" onClick={() => pick(i.id)}>
                  <div className="stk-body"><strong>{i.name}</strong><span>{whereSummary(state, i.id)}</span></div>
                  {worst && <span className={`stk-pill stk-${STATUS_TONE[worst]}`}>{STATUS_LABEL[worst]}</span>}
                </button>
              )
            })}
            {query.trim() && (
              <div className="stk-row on">
                <div className="stk-body"><strong>Use “{query.trim()}” as a one-off item</strong><span>Not kept in stock, so it goes on the shopping list</span></div>
              </div>
            )}
            {!query.trim() && matches.length === 0 && <div className="stk-empty">No stock items yet. Type a name to add a one-off item.</div>}
          </div>
        )}
        {item && <p className="stk-hint" style={{ marginTop: -6 }}>In stock: {whereSummary(state, item.id)} · <button className="link" style={{ fontSize: 12 }} onClick={() => { setItemId(undefined) }}>Change</button></p>}

        <div className="sheet-row">
          <div className="fld-form-field">
            <label>Quantity for this job</label>
            <div className="stk-step">
              <button type="button" onClick={() => { setQty((q) => Math.max(1, q - 1)); }}>−</button>
              <input inputMode="decimal" value={qty} onChange={(e) => setQty(Math.max(0, Number(e.target.value) || 0))} />
              <button type="button" onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
          </div>
          {!item && (
            <div className="fld-form-field">
              <label>Unit</label>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="each" />
            </div>
          )}
        </div>

        {material?.status !== 'used' && material?.status !== 'got' && (
          <>
            <div className="fld-form-field"><label>Where's it coming from?</label></div>
            <div className="stk-opts" style={{ flexWrap: 'wrap' }}>
              {item && locations.map((l) => {
                const have = countOf(state, item.id, l.id)
                return (
                  <button key={l.id} type="button" disabled={have <= 0}
                    className={chosen.status === 'from_stock' && fromLoc === l.id ? 'on' : ''}
                    onClick={() => setSource({ status: 'from_stock', locationId: l.id })}>
                    From {l.name}<span>{fmtNum(have)} in {l.name.toLowerCase()}</span>
                  </button>
                )
              })}
              <button type="button" className={chosen.status === 'to_buy' ? 'on' : ''} onClick={() => setSource({ status: 'to_buy' })}>
                To buy<span>Adds {fmtNum(qty)} to the shopping list</span>
              </button>
            </div>
            {chosen.status === 'from_stock' && available < qty && (
              <div className="sheet-hours bad">Only {fmtNum(available)} in the {locationName(state, fromLoc).toLowerCase()}</div>
            )}
          </>
        )}

        <button className="fld-save" style={{ width: '100%' }} disabled={!valid} onClick={save}>
          {editing ? 'Save' : 'Add to job'}
        </button>
        {editing && <button className="sheet-delete" onClick={remove}>Remove from job</button>}
    </>
  )

  return <SheetOrModal title={title} inModal={inModal} onClose={onClose}>{body}</SheetOrModal>
}
