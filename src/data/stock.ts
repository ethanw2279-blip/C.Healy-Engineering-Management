import type { Action } from './store'
import { newId } from './store'
import type { JobMaterial, MaterialStatus, State, StockItem, StockLevel, StockMoveReason, StockMovement } from './types'

// Shared stock logic for both apps: levels, the shopping list (worked out from
// low stock, job materials to buy and hand-added items), and the actions that
// move stock when materials are used or shopping is ticked off.

export type LevelStatus = 'out' | 'low' | 'ok' | 'none'

export const STATUS_LABEL: Record<LevelStatus, string> = { out: 'Out', low: 'Low', ok: 'OK', none: '—' }
export const STATUS_TONE: Record<LevelStatus, string> = { out: 'red', low: 'amber', ok: 'green', none: 'grey' }

export const MATERIAL_LABEL: Record<MaterialStatus, string> = {
  from_stock: 'From stock',
  to_buy: 'To buy',
  got: 'Got it',
  used: 'Used',
}
export const MATERIAL_TONE: Record<MaterialStatus, string> = { from_stock: 'blue', to_buy: 'amber', got: 'green', used: 'grey' }

/** A level is only "low" once it has a minimum set; min 0 means no alerts. */
export function levelStatus(l: StockLevel | undefined): LevelStatus {
  if (!l || l.min <= 0) return 'none'
  if (l.count <= 0) return 'out'
  if (l.count <= l.min) return 'low'
  return 'ok'
}

export const isShort = (l: StockLevel | undefined) => {
  const s = levelStatus(l)
  return s === 'low' || s === 'out'
}

/** How many to buy to bring a level back up to its top-up (or just above min). */
export function topUpQty(l: StockLevel): number {
  const target = l.topUp > l.min ? l.topUp : l.min + 1
  return Math.max(0, target - l.count)
}

export const fmtNum = (n: number) => String(Math.round(n * 100) / 100)
// Units are stored plural ("reels"); one of them reads "1 reel".
const singular = (unit: string) => (/xes$|ches$|shes$/.test(unit) ? unit.slice(0, -2) : /[^s]s$/.test(unit) ? unit.slice(0, -1) : unit)
export const fmtQty = (n: number, unit?: string) =>
  unit && unit !== 'each' ? `${fmtNum(n)} ${n === 1 ? singular(unit) : unit}` : fmtNum(n)

export const sortedLocations = (state: State) => [...state.stockLocations].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))

export const levelOf = (state: State, itemId: string, locationId: string) =>
  state.stockLevels.find((l) => l.itemId === itemId && l.locationId === locationId)

export const countOf = (state: State, itemId: string, locationId: string) => levelOf(state, itemId, locationId)?.count ?? 0

export const totalOf = (state: State, itemId: string) =>
  state.stockLevels.filter((l) => l.itemId === itemId).reduce((s, l) => s + l.count, 0)

/** "Van 2 · Shed 4" */
export const whereSummary = (state: State, itemId: string) =>
  sortedLocations(state).map((loc) => `${loc.name} ${fmtNum(countOf(state, itemId, loc.id))}`).join(' · ')

export const locationName = (state: State, id?: string) => state.stockLocations.find((l) => l.id === id)?.name ?? ''

// ---- Movements --------------------------------------------------------------

export function move(
  itemId: string, locationId: string, delta: number, reason: StockMoveReason,
  extra: { jobId?: string; employeeId?: string; note?: string } = {},
): StockMovement {
  return { id: newId('sm'), itemId, locationId, delta, reason, createdAt: new Date().toISOString(), ...extra }
}

export const REASON_LABEL: Record<StockMoveReason, string> = {
  used: 'Used on a job',
  returned: 'Returned from a job',
  bought: 'Bought',
  moved: 'Moved',
  counted: 'Stock take',
  adjusted: 'Adjusted',
}

// ---- Job materials ----------------------------------------------------------

/** Suggest where a material should come from: a location with enough, else buy it. */
export function suggestSource(state: State, itemId: string | undefined, qty: number): { status: MaterialStatus; locationId?: string } {
  if (!itemId) return { status: 'to_buy' }
  const locs = sortedLocations(state)
  // Prefer the van (it's on site), then anywhere with enough.
  const ordered = [...locs.filter((l) => l.kind === 'van'), ...locs.filter((l) => l.kind !== 'van')]
  const withEnough = ordered.find((l) => countOf(state, itemId, l.id) >= qty)
  return withEnough ? { status: 'from_stock', locationId: withEnough.id } : { status: 'to_buy' }
}

/** Tick a material as used. Stock taken from a location comes off its count. */
export function markUsed(m: JobMaterial, employeeId?: string): Action[] {
  const actions: Action[] = [{ type: 'UPDATE_JOB_MATERIAL', material: { ...m, status: 'used' } }]
  if (m.status === 'from_stock' && m.itemId && m.locationId)
    actions.push({ type: 'STOCK_MOVEMENTS', movements: [move(m.itemId, m.locationId, -m.qty, 'used', { jobId: m.jobId, employeeId })] })
  return actions
}

/** Untick a used material: stock it came from goes back; bought items go back to "Got it". */
export function markUnused(m: JobMaterial, employeeId?: string): Action[] {
  const fromStock = !!(m.itemId && m.locationId)
  const actions: Action[] = [{ type: 'UPDATE_JOB_MATERIAL', material: { ...m, status: fromStock ? 'from_stock' : 'got' } }]
  if (fromStock)
    actions.push({ type: 'STOCK_MOVEMENTS', movements: [move(m.itemId!, m.locationId!, m.qty, 'returned', { jobId: m.jobId, employeeId })] })
  return actions
}

// ---- Shopping list ----------------------------------------------------------

export type ShopSource =
  | { kind: 'low'; locationId: string; qty: number; out: boolean }
  | { kind: 'job'; materialId: string; jobId: string; qty: number }
  | { kind: 'manual'; shoppingId: string; qty: number; addedBy?: string }

export type ShopLine = {
  key: string
  itemId?: string
  name: string
  unit: string
  supplier: string
  qty: number
  sources: ShopSource[]
}

/** Everything to buy, one line per item, sources merged and quantities added. */
export function shoppingList(state: State): ShopLine[] {
  const lines = new Map<string, ShopLine>()
  const items = new Map<string, StockItem>(state.stockItems.map((i) => [i.id, i]))

  const lineFor = (itemId: string | undefined, name: string, unit: string): ShopLine => {
    const key = itemId ?? `name:${name.trim().toLowerCase()}`
    let line = lines.get(key)
    if (!line) {
      const item = itemId ? items.get(itemId) : undefined
      line = {
        key, itemId, name: item?.name ?? name, unit: item?.unit ?? unit,
        supplier: item?.supplier?.trim() || 'Other', qty: 0, sources: [],
      }
      lines.set(key, line)
    }
    return line
  }

  for (const l of state.stockLevels) {
    const item = items.get(l.itemId)
    if (!item?.active || !isShort(l) || !state.stockLocations.some((loc) => loc.id === l.locationId)) continue
    const qty = topUpQty(l)
    if (qty <= 0) continue
    const line = lineFor(item.id, item.name, item.unit)
    line.sources.push({ kind: 'low', locationId: l.locationId, qty, out: l.count <= 0 })
    line.qty += qty
  }
  const jobIds = new Set(state.jobs.map((j) => j.id))
  for (const m of state.jobMaterials) {
    if (m.status !== 'to_buy' || !jobIds.has(m.jobId)) continue
    const line = lineFor(m.itemId, m.name, m.unit)
    line.sources.push({ kind: 'job', materialId: m.id, jobId: m.jobId, qty: m.qty })
    line.qty += m.qty
  }
  for (const s of state.shoppingItems) {
    const line = lineFor(s.itemId, s.name, s.unit)
    line.sources.push({ kind: 'manual', shoppingId: s.id, qty: s.qty, addedBy: s.addedBy })
    line.qty += s.qty
  }
  return [...lines.values()].sort((a, b) => a.supplier.localeCompare(b.supplier) || a.name.localeCompare(b.name))
}

/** Lines grouped by supplier, "Other" last. */
export function bySupplier(lines: ShopLine[]): [string, ShopLine[]][] {
  const groups = new Map<string, ShopLine[]>()
  for (const l of lines) groups.set(l.supplier, [...(groups.get(l.supplier) ?? []), l])
  return [...groups.entries()].sort(([a], [b]) => (a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b)))
}

/** Default stock location for what's left after jobs: the one that's low, else the shed. */
export function defaultDropLocation(state: State, line: ShopLine): string | undefined {
  const low = line.sources.find((s) => s.kind === 'low')
  if (low && low.kind === 'low') return low.locationId
  const locs = sortedLocations(state)
  return (locs.find((l) => l.kind === 'shed') ?? locs[0])?.id
}

/**
 * Tick a line off as bought. Job materials picked in `toJobs` are marked "Got
 * it"; whatever's left goes into `locationId` (stock items only). Hand-added
 * entries are cleared.
 */
export function tickOff(
  state: State, line: ShopLine, bought: number, toJobs: Set<string>, locationId: string | undefined, employeeId?: string,
): Action[] {
  const actions: Action[] = []
  let left = bought
  for (const s of line.sources) {
    if (s.kind !== 'job' || !toJobs.has(s.materialId)) continue
    const m = state.jobMaterials.find((x) => x.id === s.materialId)
    if (!m) continue
    actions.push({ type: 'UPDATE_JOB_MATERIAL', material: { ...m, status: 'got', locationId: undefined } })
    left -= s.qty
  }
  if (line.itemId && locationId && left > 0)
    actions.push({ type: 'STOCK_MOVEMENTS', movements: [move(line.itemId, locationId, left, 'bought', { employeeId })] })
  for (const s of line.sources) if (s.kind === 'manual') actions.push({ type: 'REMOVE_SHOPPING_ITEM', id: s.shoppingId })
  return actions
}

/** Plain-language label for where a line came from, for the tags under its name. */
export function sourceLabel(state: State, s: ShopSource): { text: string; tone: string } {
  if (s.kind === 'low') return { text: `${s.out ? 'Out of stock' : 'Low stock'} · ${locationName(state, s.locationId)}`, tone: s.out ? 'red' : 'amber' }
  if (s.kind === 'job') {
    const job = state.jobs.find((j) => j.id === s.jobId)
    const client = state.clients.find((c) => c.id === job?.clientId)
    return { text: [job?.number, client?.name].filter(Boolean).join(' · ') || 'Job', tone: 'blue' }
  }
  const who = state.employees.find((e) => e.id === s.addedBy)?.name
  return { text: who ? `Added by ${who}` : 'Added by hand', tone: 'grey' }
}

/** Dispatch a list of actions in order. */
export const runAll = (dispatch: (a: Action) => void, actions: Action[]) => actions.forEach((a) => dispatch(a))
