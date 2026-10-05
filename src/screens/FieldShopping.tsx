import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckIcon } from '../components/Icons'
import SheetOrModal from '../components/SheetOrModal'
import { useStore, useCurrentUser, newId } from '../data/store'
import {
  bySupplier, defaultDropLocation, fmtNum, fmtQty, runAll, shoppingList, sortedLocations, sourceLabel,
  tickOff, whereSummary, type ShopLine,
} from '../data/stock'
import './screens.css'
import './field.css'
import './JobView.css'
import '../components/stock.css'

// The shared shopping list: low stock, job materials to buy, and anything
// added by hand, grouped by supplier.
export default function FieldShopping() {
  const { state } = useStore()
  const nav = useNavigate()
  const [ticking, setTicking] = useState<ShopLine | null>(null)
  const [adding, setAdding] = useState(false)
  const lines = shoppingList(state)

  return (
    <div>
      <div className="fld-topbar">
        <div className="fld-topbar-left">
          <button className="fld-back" onClick={() => nav(-1)}>←</button>
          <span>Shopping list</span>
        </div>
        <button className="fld-topbar-btn" onClick={() => setAdding(true)}>+ Add</button>
      </div>

      <div className="pad">
        <p className="stk-muted" style={{ margin: '6px 0 4px' }}>
          {lines.length === 0 ? 'Nothing to buy right now.' : `${lines.length} to buy · grouped by supplier`}
        </p>
        {bySupplier(lines).map(([supplier, group]) => (
          <div key={supplier}>
            <div className="stk-group">{supplier}</div>
            <div className="fld-card">
              {group.map((l) => <ShopRow key={l.key} line={l} onTick={() => setTicking(l)} />)}
            </div>
          </div>
        ))}
      </div>

      {ticking && <TickSheet line={ticking} onClose={() => setTicking(null)} />}
      {adding && <AddSheet onClose={() => setAdding(false)} />}
    </div>
  )
}

export function ShopRow({ line, onTick }: { line: ShopLine; onTick: () => void }) {
  const { state } = useStore()
  return (
    <div className="stk-row">
      <button className="stk-tick" aria-label={`Tick off ${line.name}`} onClick={onTick} />
      <button className="stk-body" style={{ textAlign: 'left' }} onClick={onTick}>
        <strong>{line.name}</strong>
        <span className="stk-pills">
          {line.sources.map((s, i) => {
            const { text, tone } = sourceLabel(state, s)
            return <span key={i} className={`stk-pill sm stk-${tone}`}>{text}</span>
          })}
        </span>
      </button>
      <span className="stk-qty">{fmtQty(line.qty, line.unit)}</span>
    </div>
  )
}

// Tick a line off: how many were bought, which jobs get theirs, and where the
// rest goes.
export function TickSheet({ inModal, line, onClose }: { inModal?: boolean; line: ShopLine; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const { user } = useCurrentUser()
  const locations = sortedLocations(state)
  const jobSources = line.sources.filter((s) => s.kind === 'job')
  const [bought, setBought] = useState(line.qty)
  const [toJobs, setToJobs] = useState<Set<string>>(new Set(jobSources.map((s) => (s.kind === 'job' ? s.materialId : ''))))
  const [locationId, setLocationId] = useState(defaultDropLocation(state, line))

  const forJobs = jobSources.reduce((n, s) => (s.kind === 'job' && toJobs.has(s.materialId) ? n + s.qty : n), 0)
  const left = Math.max(0, bought - forJobs)

  const save = () => {
    runAll(dispatch, tickOff(state, line, bought, toJobs, locationId, user?.id))
    onClose()
  }

  const toggleJob = (id: string) => setToJobs((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  return (
    <SheetOrModal title={`Bought: ${line.name}`} inModal={inModal} onClose={onClose}>
      <div className="fld-form-field">
        <label>How many did you get?{line.unit !== 'each' ? ` (${line.unit})` : ''}</label>
        <div className="stk-step">
          <button type="button" onClick={() => setBought((q) => Math.max(0, q - 1))}>−</button>
          <input inputMode="decimal" value={bought} onChange={(e) => setBought(Math.max(0, Number(e.target.value) || 0))} />
          <button type="button" onClick={() => setBought((q) => q + 1)}>+</button>
        </div>
      </div>

      {jobSources.length > 0 && (
        <>
          <div className="fld-form-field"><label>Straight to a job</label></div>
          <div className="fld-card" style={{ marginBottom: 14 }}>
            {jobSources.map((s) => {
              if (s.kind !== 'job') return null
              const on = toJobs.has(s.materialId)
              return (
                <button key={s.materialId} className="stk-row" onClick={() => toggleJob(s.materialId)}>
                  <div className="stk-body"><strong>{fmtQty(s.qty, line.unit)} for {sourceLabel(state, s).text}</strong><span>{on ? 'Marked “Got it” on the job' : 'Stays on the list for this job'}</span></div>
                  <span className={`stk-tick ${on ? 'on' : ''}`}>{on && <CheckIcon size={14} />}</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {line.itemId && locations.length > 0 ? (
        <div className="fld-form-field">
          <label>{jobSources.length ? `The other ${fmtNum(left)} go into` : 'Where did they go?'}</label>
          <div className="stk-opts" style={{ flexWrap: 'wrap', margin: 0 }}>
            {locations.map((l) => (
              <button key={l.id} type="button" className={locationId === l.id ? 'on' : ''} onClick={() => setLocationId(l.id)}>
                {l.name}<span>{l.name} count goes to {fmtNum((state.stockLevels.find((x) => x.itemId === line.itemId && x.locationId === l.id)?.count ?? 0) + left)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : !line.itemId && left > 0 && jobSources.length > 0 ? (
        <p className="stk-hint" style={{ marginTop: 0 }}>This isn't a stock item, so extras aren't counted anywhere.</p>
      ) : null}

      <button className="fld-save" style={{ width: '100%' }} disabled={bought <= 0} onClick={save}>Tick off</button>
    </SheetOrModal>
  )
}

// Add something to the list by hand: a stock item or anything else.
export function AddSheet({ inModal, onClose }: { inModal?: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const { user } = useCurrentUser()
  const [name, setName] = useState('')
  const [qty, setQty] = useState(1)
  const item = state.stockItems.find((i) => i.name.toLowerCase() === name.trim().toLowerCase())

  const save = () => {
    if (!name.trim() || qty <= 0) return
    dispatch({
      type: 'ADD_SHOPPING_ITEM',
      item: { id: newId('sh'), itemId: item?.id, name: item?.name ?? name.trim(), unit: item?.unit ?? 'each', qty, addedBy: user?.id, createdAt: new Date().toISOString() },
    })
    onClose()
  }

  return (
    <SheetOrModal title="Add to shopping list" inModal={inModal} onClose={onClose}>
      <div className="fld-form-field">
        <label>What do you need?</label>
        <input autoFocus list="stk-items" value={name} onChange={(e) => setName(e.target.value)} placeholder="Pick a stock item or type anything" />
        <datalist id="stk-items">{state.stockItems.filter((i) => i.active).map((i) => <option key={i.id} value={i.name} />)}</datalist>
      </div>
      {item && <p className="stk-hint">Stock item · {whereSummary(state, item.id)} · usually from {item.supplier || 'any supplier'}</p>}
      <div className="fld-form-field">
        <label>How many?{item && item.unit !== 'each' ? ` (${item.unit})` : ''}</label>
        <div className="stk-step">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <input inputMode="decimal" value={qty} onChange={(e) => setQty(Math.max(0, Number(e.target.value) || 0))} />
          <button type="button" onClick={() => setQty((q) => q + 1)}>+</button>
        </div>
      </div>
      <button className="fld-save" style={{ width: '100%' }} disabled={!name.trim() || qty <= 0} onClick={save}>Add to list</button>
    </SheetOrModal>
  )
}

