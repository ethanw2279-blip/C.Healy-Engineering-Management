import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore, useCurrentUser, formatDateTimeShort } from '../data/store'
import type { StockItem } from '../data/types'
import {
  countOf, fmtNum, fmtQty, levelOf, levelStatus, isShort, move, REASON_LABEL, sortedLocations, STATUS_LABEL, STATUS_TONE,
  totalOf, whereSummary,
} from '../data/stock'
import { useStockItemForm } from '../components/useStockItemForm'
import SheetOrModal from '../components/SheetOrModal'
import './screens.css'
import './field.css'
import './JobView.css'
import '../components/stock.css'

const ALL = 'all'

// Stock in the van and the shed: quick − / + counts, low items first, moving
// stock from the shed to the van, and a stock take mode.
export default function FieldStock() {
  const { state, dispatch } = useStore()
  const { user, can } = useCurrentUser()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const locations = sortedLocations(state)
  const firstVan = locations.find((l) => l.kind === 'van') ?? locations[0]
  const tab = params.get('loc') && (params.get('loc') === ALL || locations.some((l) => l.id === params.get('loc')))
    ? params.get('loc')!
    : firstVan?.id ?? ALL
  const [sheet, setSheet] = useState<{ kind: 'item'; item?: StockItem } | { kind: 'load' } | null>(null)
  const [counting, setCounting] = useState<Record<string, string> | null>(null)

  const canManage = can('manage:stock')
  const items = state.stockItems.filter((i) => i.active).sort((a, b) => a.name.localeCompare(b.name))
  const inTab = tab === ALL ? items : items.filter((i) => levelOf(state, i.id, tab))
  const short = tab === ALL ? [] : inTab.filter((i) => isShort(levelOf(state, i.id, tab)))
  const rest = inTab.filter((i) => !short.includes(i))
  const loc = locations.find((l) => l.id === tab)

  const bump = (itemId: string, delta: number) => {
    if (tab === ALL) return
    if (delta < 0 && countOf(state, itemId, tab) <= 0) return
    dispatch({ type: 'STOCK_MOVEMENTS', movements: [move(itemId, tab, delta, 'adjusted', { employeeId: user?.id })] })
  }

  const saveCount = () => {
    if (!counting || tab === ALL) return
    const movements = Object.entries(counting)
      .map(([itemId, v]) => ({ itemId, diff: (Number(v) || 0) - countOf(state, itemId, tab) }))
      .filter((c) => c.diff !== 0)
      .map((c) => move(c.itemId, tab, c.diff, 'counted', { employeeId: user?.id }))
    if (movements.length) dispatch({ type: 'STOCK_MOVEMENTS', movements })
    setCounting(null)
  }

  const row = (i: StockItem) => {
    const lv = tab === ALL ? undefined : levelOf(state, i.id, tab)
    const status = tab === ALL
      ? (['out', 'low'] as const).find((w) => locations.some((l) => levelStatus(levelOf(state, i.id, l.id)) === w)) ?? 'none'
      : levelStatus(lv)
    return (
      <div key={i.id} className="stk-row">
        <button className="stk-body" style={{ textAlign: 'left' }} onClick={() => setSheet({ kind: 'item', item: i })}>
          <strong>{i.name}</strong>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {status !== 'none' && <span className={`stk-pill sm stk-${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>}
            {tab === ALL ? whereSummary(state, i.id) : `${lv && lv.min > 0 ? `min ${fmtNum(lv.min)} · ` : ''}${i.unit}`}
          </span>
        </button>
        {tab === ALL ? (
          <span className="stk-qty">{fmtNum(totalOf(state, i.id))}</span>
        ) : counting ? (
          <div className="stk-step">
            <input inputMode="decimal" aria-label={`${i.name} count`} value={counting[i.id] ?? fmtNum(lv?.count ?? 0)}
              onChange={(e) => setCounting({ ...counting, [i.id]: e.target.value })} />
          </div>
        ) : (
          <div className="stk-step">
            <button aria-label={`One less ${i.name}`} onClick={() => bump(i.id, -1)}>−</button>
            <b>{fmtNum(lv?.count ?? 0)}</b>
            <button aria-label={`One more ${i.name}`} onClick={() => bump(i.id, 1)}>+</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="fld-topbar">
        <div className="fld-topbar-left">
          <button className="fld-back" onClick={() => nav(-1)}>←</button>
          <span>{counting ? `Stock take · ${loc?.name ?? ''}` : 'Stock'}</span>
        </div>
        {counting ? (
          <button className="fld-topbar-btn" onClick={saveCount}>Save</button>
        ) : canManage ? (
          <button className="fld-topbar-btn" onClick={() => setSheet({ kind: 'item' })}>+ Item</button>
        ) : null}
      </div>

      <div className="pad">
        {!counting && (
          <div className="stk-seg">
            {locations.map((l) => (
              <button key={l.id} className={tab === l.id ? 'on' : ''} onClick={() => setParams({ loc: l.id }, { replace: true })}>{l.name}</button>
            ))}
            <button className={tab === ALL ? 'on' : ''} onClick={() => setParams({ loc: ALL }, { replace: true })}>All</button>
          </div>
        )}

        {short.length > 0 && !counting && (
          <button className="stk-alert" style={{ width: '100%', textAlign: 'left' }} onClick={() => nav('/field/shopping')}>
            ⚠ <span><b>{short.length} item{short.length === 1 ? '' : 's'}</b> low or out in the {loc?.name.toLowerCase()}. {short.length === 1 ? 'It is' : 'They are'} on the shopping list.</span>
          </button>
        )}

        {items.length === 0 ? (
          <div className="fld-card"><div className="stk-empty">No stock items yet.{canManage ? ' Tap + Item to add the first one.' : ' Ask the office to add them.'}</div></div>
        ) : (
          <>
            {short.length > 0 && (
              <>
                <div className="stk-group">Needs topping up</div>
                <div className="fld-card">{short.map(row)}</div>
              </>
            )}
            {rest.length > 0 && (
              <>
                {short.length > 0 && <div className="stk-group">OK</div>}
                <div className="fld-card" style={short.length ? undefined : { marginTop: 4 }}>{rest.map(row)}</div>
              </>
            )}
            {inTab.length === 0 && <div className="fld-card"><div className="stk-empty">Nothing kept in the {loc?.name.toLowerCase()} yet. Add it from an item's details.</div></div>}
          </>
        )}

        {!counting && tab !== ALL && items.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {locations.length > 1 && <button className="fld-ghost-btn" style={{ flex: 1 }} onClick={() => setSheet({ kind: 'load' })}>Move stock</button>}
            <button className="fld-ghost-btn" style={{ flex: 1 }} onClick={() => setCounting({})}>Stock take</button>
          </div>
        )}
        {counting && <button className="fld-ghost-btn" style={{ width: '100%', marginTop: 16 }} onClick={() => setCounting(null)}>Cancel stock take</button>}
      </div>

      {sheet?.kind === 'item' && <ItemSheet item={sheet.item} onClose={() => setSheet(null)} />}
      {sheet?.kind === 'load' && <MoveSheet onClose={() => setSheet(null)} />}
    </div>
  )
}

// Details of one item: counts everywhere, recent history, and (with Manage
// stock) its name, supplier and minimum levels.
export function ItemSheet({ inModal, item, onClose }: { inModal?: boolean; item?: StockItem; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const { can } = useCurrentUser()
  const canManage = can('manage:stock')
  const f = useStockItemForm(item)
  const history = item ? state.stockMovements.filter((m) => m.itemId === item.id).slice(0, 12) : []

  const save = () => { f.save(); onClose() }
  const remove = () => {
    if (item && confirm(`Remove ${item.name} from stock? Its history goes too.`)) {
      dispatch({ type: 'REMOVE_STOCK_ITEM', id: item.id })
      onClose()
    }
  }

  return (
    <SheetOrModal title={item ? (canManage ? 'Edit item' : item.name) : 'New stock item'} inModal={inModal} onClose={onClose}>

      {canManage && (
        <>
          <div className="fld-form-field"><label>Name</label><input value={f.name} onChange={(e) => f.setName(e.target.value)} placeholder="e.g. MIG wire 0.8mm 5kg" /></div>
          <div className="sheet-row">
            <div className="fld-form-field"><label>Unit</label><input value={f.unit} onChange={(e) => f.setUnit(e.target.value)} placeholder="each, reels, lengths…" /></div>
            <div className="fld-form-field"><label>Category</label><input list="stk-cats" value={f.category} onChange={(e) => f.setCategory(e.target.value)} /></div>
          </div>
          <div className="sheet-row">
            <div className="fld-form-field"><label>Usual supplier</label><input list="stk-sups" value={f.supplier} onChange={(e) => f.setSupplier(e.target.value)} /></div>
            <div className="fld-form-field"><label>Cost each (€)</label><input inputMode="decimal" value={f.cost} onChange={(e) => f.setCost(e.target.value)} /></div>
          </div>
          <datalist id="stk-cats">{f.categories.map((c) => <option key={c} value={c} />)}</datalist>
          <datalist id="stk-sups">{f.suppliers.map((c) => <option key={c} value={c} />)}</datalist>
        </>
      )}

      <table className="stk-levels">
        <thead>
          <tr><th />{item && <th>Count</th>}{!item && <th>Count now</th>}<th>Alert at</th><th>Top up to</th></tr>
        </thead>
        <tbody>
          {f.locations.map((l) => {
            const d = f.levels.find((x) => x.locationId === l.id)!
            return (
              <tr key={l.id}>
                <td>{l.name}</td>
                <td>{item ? fmtNum(countOf(state, item.id, l.id)) : <input inputMode="decimal" value={d.start} onChange={(e) => f.setLevel(l.id, 'start', e.target.value)} />}</td>
                <td>{canManage ? <input inputMode="decimal" value={d.min} onChange={(e) => f.setLevel(l.id, 'min', e.target.value)} /> : d.min}</td>
                <td>{canManage ? <input inputMode="decimal" value={d.topUp} onChange={(e) => f.setLevel(l.id, 'topUp', e.target.value)} /> : d.topUp}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {canManage && <p className="stk-hint">Alert at: you get a low-stock alert at or below this number (0 = no alerts). Top up to: how many the shopping list suggests buying back up to.</p>}

      {item && (
        <>
          <div className="fld-form-field"><label>Recent changes</label></div>
          {history.length === 0 ? <p className="stk-muted" style={{ marginBottom: 14 }}>No changes yet.</p> : (
            <ul className="stk-history" style={{ marginBottom: 14 }}>
              {history.map((m) => {
                const job = state.jobs.find((j) => j.id === m.jobId)
                const who = state.employees.find((e) => e.id === m.employeeId)?.name
                const where = state.stockLocations.find((l) => l.id === m.locationId)?.name
                return (
                  <li key={m.id}>
                    <span><b>{REASON_LABEL[m.reason]}</b>{job ? ` · ${job.number}` : ''} · {where}<br />{[who, formatDateTimeShort(m.createdAt)].filter(Boolean).join(' · ')}</span>
                    <span className={m.delta > 0 ? 'stk-delta-up' : 'stk-delta-down'}>{m.delta > 0 ? '+' : ''}{fmtQty(m.delta)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      {canManage ? (
        <>
          <button className="fld-save" style={{ width: '100%' }} disabled={!f.valid} onClick={save}>{item ? 'Save' : 'Add item'}</button>
          {item && <button className="sheet-delete" onClick={remove}>Remove item</button>}
        </>
      ) : (
        <button className="fld-ghost-btn" style={{ width: '100%' }} onClick={onClose}>Close</button>
      )}
    </SheetOrModal>
  )
}

// Move stock between locations, e.g. load the van from the shed.
export function MoveSheet({ inModal, onClose }: { inModal?: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const { user } = useCurrentUser()
  const locations = sortedLocations(state)
  const shed = locations.find((l) => l.kind === 'shed') ?? locations[0]
  const van = locations.find((l) => l.id !== shed?.id) ?? locations[0]
  const [from, setFrom] = useState(shed?.id ?? '')
  const [to, setTo] = useState(van?.id ?? '')
  const [itemId, setItemId] = useState('')
  const [qty, setQty] = useState(1)

  const items = state.stockItems.filter((i) => i.active && countOf(state, i.id, from) > 0).sort((a, b) => a.name.localeCompare(b.name))
  const have = itemId ? countOf(state, itemId, from) : 0
  const valid = !!itemId && from !== to && qty > 0 && qty <= have
  const fromName = locations.find((l) => l.id === from)?.name ?? ''
  const toName = locations.find((l) => l.id === to)?.name ?? ''

  const save = () => {
    if (!valid) return
    dispatch({
      type: 'STOCK_MOVEMENTS',
      movements: [
        move(itemId, from, -qty, 'moved', { employeeId: user?.id, note: `To ${toName}` }),
        move(itemId, to, qty, 'moved', { employeeId: user?.id, note: `From ${fromName}` }),
      ],
    })
    onClose()
  }

  return (
    <SheetOrModal title="Move stock" inModal={inModal} onClose={onClose}>
      <div className="sheet-row">
        <div className="fld-form-field"><label>From</label>
          <select value={from} onChange={(e) => { setFrom(e.target.value); setItemId('') }}>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
        </div>
        <div className="fld-form-field"><label>To</label>
          <select value={to} onChange={(e) => setTo(e.target.value)}>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
        </div>
      </div>
      <div className="fld-form-field"><label>Item</label>
        <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
          <option value="">Select…</option>
          {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({fmtNum(countOf(state, i.id, from))} in {fromName.toLowerCase()})</option>)}
        </select>
      </div>
      <div className="fld-form-field"><label>How many?</label>
        <div className="stk-step">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <input inputMode="decimal" value={qty} onChange={(e) => setQty(Math.max(0, Number(e.target.value) || 0))} />
          <button type="button" onClick={() => setQty((q) => q + 1)}>+</button>
        </div>
      </div>
      {itemId && qty > have && <div className="sheet-hours bad">Only {fmtNum(have)} in the {fromName.toLowerCase()}</div>}
      {from === to && <div className="sheet-hours bad">Pick two different places</div>}
      <button className="fld-save" style={{ width: '100%' }} disabled={!valid} onClick={save}>Move {fmtNum(qty)} to {toName}</button>
    </SheetOrModal>
  )
}
