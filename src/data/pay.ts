import type { State, TimeEntry } from './types'

// Gross-pay maths for a set of time entries, split by approval status.
// `work` hours pay at the employee's hourly rate; `travel` hours at their
// travel rate (which may be 0). Everything here is reused by the mobile pay
// screen and can back the office timesheet view too.

export type PaySlice = {
  hours: number
  gross: number
}

export type PayBreakdown = {
  working: { approved: PaySlice; pending: PaySlice }
  travel: { approved: PaySlice; pending: PaySlice }
  total: { approved: PaySlice; pending: PaySlice }
}

const emptySlice = (): PaySlice => ({ hours: 0, gross: 0 })

/**
 * Gross pay for one employee across the given time entries.
 * Pass the entries already narrowed to the employee + period you care about.
 */
export function payFor(entries: TimeEntry[], hourlyRate: number, travelRate: number): PayBreakdown {
  const b: PayBreakdown = {
    working: { approved: emptySlice(), pending: emptySlice() },
    travel: { approved: emptySlice(), pending: emptySlice() },
    total: { approved: emptySlice(), pending: emptySlice() },
  }

  for (const t of entries) {
    const rate = t.kind === 'travel' ? travelRate : hourlyRate
    const section = t.kind === 'travel' ? b.travel : b.working
    const bucket = t.approved ? 'approved' : 'pending'
    section[bucket].hours += t.hours
    section[bucket].gross += t.hours * rate
    b.total[bucket].hours += t.hours
    b.total[bucket].gross += t.hours * rate
  }

  return b
}

/** Convenience: pay for one employee for a specific set of week dates. */
export function weekPayFor(state: State, employeeId: string, weekDates: string[]): PayBreakdown {
  const emp = state.employees.find((e) => e.id === employeeId)
  const dates = new Set(weekDates)
  const entries = state.timeEntries.filter((t) => t.employeeId === employeeId && dates.has(t.date))
  return payFor(entries, emp?.hourlyRate ?? 0, emp?.travelRate ?? 0)
}
