import type { State, Visit } from '../data/types'

export const todayISO = () => new Date().toISOString().slice(0, 10)

export function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export const firstName = (name?: string) => (name ?? '').split(' ')[0]

export const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long' })

export const fmtDayShort = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' })

// Monday-based week containing `d`, as ISO date strings.
export function weekDatesISO(d = new Date()) {
  const start = new Date(d)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(start)
    x.setDate(start.getDate() + i)
    return x.toISOString().slice(0, 10)
  })
}

export type ResolvedVisit = Visit & { jobTitle: string; clientName: string; address: string }

// A crew member's visits, newest job info resolved, sorted by date+time.
export function visitsForUser(state: State, userId: string): ResolvedVisit[] {
  return state.visits
    .filter((v) => v.employeeId === userId)
    .map((v) => {
      const job = v.jobId ? state.jobs.find((j) => j.id === v.jobId) : undefined
      const client = state.clients.find((c) => c.id === job?.clientId)
      return {
        ...v,
        jobTitle: job?.title ?? v.title ?? v.category ?? 'Visit',
        clientName: client?.name ?? (v.category && v.category !== 'Job' ? v.category : ''),
        address: client?.address ?? '',
      }
    })
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
}
