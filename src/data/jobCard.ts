import type { Action } from './store'
import { newId } from './store'
import type { Employee, JobStage, LineItem, StageEntry, State } from './types'

// Shared job card logic for both apps: stages in order, hours per stage,
// timers, and turning a job card into quote / invoice lines.

export const stagesOf = (state: State, jobId: string) =>
  state.jobStages.filter((s) => s.jobId === jobId).sort((a, b) => a.sort - b.sort || a.createdAt.localeCompare(b.createdAt))

export const entriesOf = (state: State, stageId: string) =>
  state.stageEntries.filter((e) => e.stageId === stageId).sort((a, b) => (a.date + a.createdAt).localeCompare(b.date + b.createdAt))

/** Hours on a running timer so far. */
export const runningHours = (e: StageEntry, now = Date.now()) =>
  e.startedAt ? Math.max(0, (now - new Date(e.startedAt).getTime()) / 3_600_000) : 0

/** Hours an entry counts for: its logged hours, plus the timer so far while it runs. */
export const entryHours = (e: StageEntry, now = Date.now()) => e.hours + runningHours(e, now)

export const stageHours = (state: State, stageId: string, now = Date.now()) =>
  entriesOf(state, stageId).reduce((s, e) => s + entryHours(e, now), 0)

export const jobCardHours = (state: State, jobId: string, now = Date.now()) =>
  state.stageEntries.filter((e) => e.jobId === jobId).reduce((s, e) => s + entryHours(e, now), 0)

/** 3.4 → "3.4h", 4 → "4.0h" */
export const fmtHours = (h: number) => `${(Math.round(h * 10) / 10).toFixed(1)}h`

/** 1:42 */
export const fmtClock = (h: number) => {
  const mins = Math.floor(h * 60)
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`
}

export const isRunning = (e: StageEntry) => !!e.startedAt

export const stageRunning = (state: State, stageId: string) => entriesOf(state, stageId).some(isRunning)

export type StageStatus = 'done' | 'running' | 'started' | 'todo'
export function stageStatus(state: State, stage: JobStage): StageStatus {
  if (stage.done) return 'done'
  if (stageRunning(state, stage.id)) return 'running'
  return entriesOf(state, stage.id).length ? 'started' : 'todo'
}
export const STAGE_LABEL: Record<StageStatus, string> = { done: 'Done', running: 'Timer on', started: 'In progress', todo: 'Not started' }
export const STAGE_TONE: Record<StageStatus, string> = { done: 'green', running: 'blue', started: 'amber', todo: 'grey' }

/** Everyone who has logged time on a stage, in the order they first did. */
export function stageCrew(state: State, stageId: string): Employee[] {
  const ids = [...new Set(entriesOf(state, stageId).map((e) => e.employeeId).filter(Boolean))] as string[]
  return ids.map((id) => state.employees.find((e) => e.id === id)).filter(Boolean) as Employee[]
}

/** The signed-in person's running timer, on any job. */
export const myRunningEntry = (state: State, employeeId?: string) =>
  employeeId ? state.stageEntries.find((e) => e.employeeId === employeeId && e.startedAt) : undefined

export const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Stop a running timer: the time so far becomes logged hours. */
export function stopTimer(e: StageEntry): Action {
  return { type: 'UPDATE_STAGE_ENTRY', entry: { ...e, hours: round2(e.hours + runningHours(e)), startedAt: undefined } }
}

/** Start a timer on a stage. Any other timer this person has running is stopped first. */
export function startTimer(state: State, stage: JobStage, employeeId: string): Action[] {
  const actions: Action[] = []
  const running = myRunningEntry(state, employeeId)
  if (running) actions.push(stopTimer(running))
  const now = new Date().toISOString()
  actions.push({
    type: 'ADD_STAGE_ENTRY',
    entry: { id: newId('se'), stageId: stage.id, jobId: stage.jobId, employeeId, date: todayIso(), hours: 0, startedAt: now, createdAt: now },
  })
  return actions
}

/** New stages go on the end of the list. */
export function newStage(state: State, jobId: string, name: string, offset = 0): JobStage {
  const list = stagesOf(state, jobId)
  const last = list[list.length - 1]
  return { id: newId('st'), jobId, name: name.trim(), sort: (last ? last.sort + 1 : 0) + offset, done: false, createdAt: new Date().toISOString() }
}

/** Swap a stage with its neighbour (dir -1 = up, 1 = down). */
export function moveStage(state: State, stage: JobStage, dir: -1 | 1): Action[] {
  const list = stagesOf(state, stage.jobId)
  const i = list.findIndex((s) => s.id === stage.id)
  const other = list[i + dir]
  if (!other) return []
  // Re-number the whole list so equal sort values can't get stuck.
  const order = list.map((s) => s.id)
  order[i] = other.id
  order[i + dir] = stage.id
  return order
    .map((id, n) => ({ s: list.find((x) => x.id === id)!, n }))
    .filter(({ s, n }) => s.sort !== n)
    .map(({ s, n }) => ({ type: 'UPDATE_JOB_STAGE', stage: { ...s, sort: n } }) as Action)
}

// ---- Turn a job card into a quote / invoice ---------------------------------

export type CardLineOptions = {
  rate: number
  perStage: boolean
  materials: boolean
  unfinished: boolean
  showWho: boolean
}

export type CardLine = LineItem & { key: string; kind: 'stage' | 'total' | 'material'; noHours?: boolean }

export function cardLines(state: State, jobId: string, opts: CardLineOptions): CardLine[] {
  const stages = stagesOf(state, jobId).filter((s) => opts.unfinished || s.done)
  const lines: CardLine[] = []
  const round1 = (n: number) => Math.round(n * 10) / 10
  if (opts.perStage) {
    for (const s of stages) {
      const hours = round1(stageHours(state, s.id))
      const who = opts.showWho ? stageCrew(state, s.id).map((e) => e.name.split(' ')[0]).join(', ') : ''
      lines.push({
        key: `stage:${s.id}`, kind: 'stage', id: newId('li'),
        name: who ? `${s.name} (${who})` : s.name, qty: hours, unitPrice: opts.rate, noHours: hours === 0,
      })
    }
  } else if (stages.length) {
    const hours = round1(stages.reduce((sum, s) => sum + stageHours(state, s.id), 0))
    lines.push({ key: 'total', kind: 'total', id: newId('li'), name: `Labour: ${stages.map((s) => s.name).join(', ')}`, qty: hours, unitPrice: opts.rate })
  }
  if (opts.materials) {
    for (const m of state.jobMaterials.filter((x) => x.jobId === jobId)) {
      const cost = state.stockItems.find((i) => i.id === m.itemId)?.cost ?? 0
      lines.push({ key: `mat:${m.id}`, kind: 'material', id: newId('li'), name: m.name, qty: m.qty, unitPrice: cost })
    }
  }
  return lines
}
