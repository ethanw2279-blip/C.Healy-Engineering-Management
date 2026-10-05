import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader, Button, EmptyState, Modal, Field } from '../components/ui'
import { PlusIcon } from '../../components/Icons'
import { useStore, useCurrentUser, newId } from '../../data/store'
import type { StockItem, StockLocation } from '../../data/types'
import {
  bySupplier, countOf, fmtNum, isShort, levelOf, levelStatus, move, shoppingList, sortedLocations,
  STATUS_LABEL, STATUS_TONE, totalOf, whereSummary, type ShopLine,
} from '../../data/stock'
import { ItemSheet, MoveSheet } from '../../screens/FieldStock'
import { AddSheet, ShopRow, TickSheet } from '../../screens/FieldShopping'
import '../../components/stock.css'

const ALL = 'all'
const BAR: Record<string, string> = { ok: 'var(--green)', low: 'var(--amber)', out: 'var(--red)', none: 'var(--border-strong)' }

// Office Stock page: counts per location, minimums, and the shopping list.
export default function Stock() {
  const { state, dispatch } = useStore()
  const { user, can } = useCurrentUser()
  const [params, setParams] = useSearchParams()
  const canManage = can('manage:stock')
  const locations = sortedLocations(state)
  const firstVan = locations.find((l) => l.kind === 'van') ?? locations[0]
  const param = params.get('loc')
  const tab = param && (param === ALL || locations.some((l) => l.id === param)) ? param : firstVan?.id ?? ALL
  const [modal, setModal] = useState<
    { kind: 'item'; item?: StockItem } | { kind: 'move' } | { kind: 'locations' } | { kind: 'tick'; line: ShopLine } | { kind: 'add' } | null
  >(null)

  const items = state.stockItems.filter((i) => i.active)
  const shown = (tab === ALL ? items : items.filter((i) => levelOf(state, i.id, tab)))
    .sort((a, b) => {
      const rank = (i: StockItem) => (tab === ALL ? 2 : ({ out: 0, low: 1 } as Record<string, number>)[levelStatus(levelOf(state, i.id, tab))] ?? 2)
      return rank(a) - rank(b) || a.name.localeCompare(b.name)
    })
  const shortCount = state.stockLevels.filter((l) => isShort(l) && items.some((i) => i.id === l.itemId)).length
  const lines = shoppingList(state)

  const bump = (itemId: string, delta: number) => {
    if (tab === ALL || (delta < 0 && countOf(state, itemId, tab) <= 0)) return
    dispatch({ type: 'STOCK_MOVEMENTS', movements: [move(itemId, tab, delta, 'adjusted', { employeeId: user?.id })] })
  }

  return (
    <div>
      <PageHeader
        title="Stock"
        subtitle={`${locations.map((l) => l.name).join(' and ')} · ${shortCount ? `${shortCount} low or out` : 'nothing low'}`}
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            {canManage && <Button variant="secondary" onClick={() => setModal({ kind: 'locations' })}>Locations</Button>}
            {locations.length > 1 && <Button variant="secondary" onClick={() => setModal({ kind: 'move' })}>Move stock</Button>}
            {canManage && <Button onClick={() => setModal({ kind: 'item' })}>New item</Button>}
          </div>
        }
      />

      <div className="stk-layout">
        <div>
          <div className="stk-tabs">
            {locations.map((l) => (
              <button key={l.id} className={tab === l.id ? 'on' : ''} onClick={() => setParams({ loc: l.id }, { replace: true })}>
                {l.name} ({items.filter((i) => levelOf(state, i.id, l.id)).length})
              </button>
            ))}
            <button className={tab === ALL ? 'on' : ''} onClick={() => setParams({ loc: ALL }, { replace: true })}>All</button>
          </div>
          <div className="card">
            {shown.length === 0 ? (
              <EmptyState title="No stock items here yet" hint={canManage ? 'Add items with New item.' : undefined} />
            ) : tab === ALL ? (
              <table className="table">
                <thead><tr><th>Item</th><th>Where</th><th className="num">Total</th><th>Supplier</th></tr></thead>
                <tbody>
                  {shown.map((i) => (
                    <tr key={i.id} className="clickable" onClick={() => setModal({ kind: 'item', item: i })}>
                      <td><div className="stack-tight"><span className="cell-strong">{i.name}</span><span className="cell-muted">{[i.category, i.unit].filter(Boolean).join(' · ')}</span></div></td>
                      <td className="cell-muted">{whereSummary(state, i.id)}</td>
                      <td className="num cell-strong">{fmtNum(totalOf(state, i.id))}</td>
                      <td className="cell-muted">{i.supplier || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="table">
                <thead><tr><th>Item</th><th className="num">Count</th><th>Level</th><th className="num">Alert at</th><th className="num">Top up to</th><th /></tr></thead>
                <tbody>
                  {shown.map((i) => {
                    const lv = levelOf(state, i.id, tab)
                    const st = levelStatus(lv)
                    const pct = lv && lv.topUp > 0 ? Math.min(100, (lv.count / lv.topUp) * 100) : 0
                    return (
                      <tr key={i.id} className="clickable" onClick={() => setModal({ kind: 'item', item: i })}>
                        <td><div className="stack-tight"><span className="cell-strong" style={{ whiteSpace: 'nowrap' }}>{i.name}</span><span className="cell-muted">{[i.category, i.unit].filter(Boolean).join(' · ')}</span></div></td>
                        <td className="num cell-strong">{fmtNum(lv?.count ?? 0)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="stk-bar"><i style={{ width: `${pct}%`, background: BAR[st] }} /></div>
                            {st !== 'none' && <span className={`stk-pill stk-${STATUS_TONE[st]}`}>{STATUS_LABEL[st]}</span>}
                          </div>
                        </td>
                        <td className="num cell-muted">{lv && lv.min > 0 ? fmtNum(lv.min) : '—'}</td>
                        <td className="num cell-muted">{lv && lv.topUp > 0 ? fmtNum(lv.topUp) : '—'}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="stk-step" style={{ transform: 'scale(0.85)' }}>
                            <button aria-label={`One less ${i.name}`} onClick={() => bump(i.id, -1)}>−</button>
                            <button aria-label={`One more ${i.name}`} onClick={() => bump(i.id, 1)}>+</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card stk-panel">
          <div className="stk-panel-head">
            <strong>Shopping list</strong>
            <span className="cell-muted">{lines.length ? `${lines.length} to buy` : 'Nothing to buy'}</span>
          </div>
          {bySupplier(lines).map(([supplier, group]) => (
            <div key={supplier}>
              <div className="stk-group">{supplier}</div>
              {group.map((l) => <ShopRow key={l.key} line={l} onTick={() => setModal({ kind: 'tick', line: l })} />)}
            </div>
          ))}
          <button className="stk-add" onClick={() => setModal({ kind: 'add' })}><PlusIcon size={16} /> Add to list</button>
        </div>
      </div>

      {modal?.kind === 'item' && <ItemSheet inModal item={modal.item} onClose={() => setModal(null)} />}
      {modal?.kind === 'move' && <MoveSheet inModal onClose={() => setModal(null)} />}
      {modal?.kind === 'tick' && <TickSheet inModal line={modal.line} onClose={() => setModal(null)} />}
      {modal?.kind === 'add' && <AddSheet inModal onClose={() => setModal(null)} />}
      {modal?.kind === 'locations' && <LocationsModal onClose={() => setModal(null)} />}
    </div>
  )
}

// Rename locations or add another van.
function LocationsModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore()
  const locations = sortedLocations(state)
  const [names, setNames] = useState<Record<string, string>>(() => Object.fromEntries(locations.map((l) => [l.id, l.name])))
  const [newName, setNewName] = useState('')

  const save = () => {
    for (const l of locations) {
      const n = names[l.id]?.trim()
      if (n && n !== l.name) dispatch({ type: 'UPDATE_STOCK_LOCATION', location: { ...l, name: n } })
    }
    if (newName.trim()) {
      const loc: StockLocation = { id: newId('loc'), name: newName.trim(), kind: 'van', sort: Math.max(0, ...locations.map((l) => l.sort)) + 1 }
      dispatch({ type: 'ADD_STOCK_LOCATION', location: loc })
    }
    onClose()
  }

  const remove = (l: StockLocation) => {
    const holding = state.stockLevels.some((x) => x.locationId === l.id && x.count > 0)
    if (confirm(holding ? `${l.name} still has stock counted in it. Remove it and its counts?` : `Remove ${l.name}?`))
      dispatch({ type: 'REMOVE_STOCK_LOCATION', id: l.id })
  }

  return (
    <Modal title="Stock locations" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Save</Button></>}>
      {locations.map((l) => (
        <div key={l.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Field label={l.kind === 'shed' ? 'Shed' : 'Van'}>
              <input value={names[l.id] ?? ''} onChange={(e) => setNames({ ...names, [l.id]: e.target.value })} />
            </Field>
          </div>
          {locations.length > 1 && <Button variant="ghost" style={{ marginBottom: 16 }} onClick={() => remove(l)}>Remove</Button>}
        </div>
      ))}
      <Field label="Add a van">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Van 2" />
      </Field>
    </Modal>
  )
}
