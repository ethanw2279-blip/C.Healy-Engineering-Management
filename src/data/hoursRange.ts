import { weekDatesISO } from '../mobile/fieldHelpers'

// Date-range helpers shared by the office Timesheets/Trips pages and the
// manager Team hours screen in the field app.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export type Period = 'week' | 'month' | 'custom'

const pad = (n: number) => String(n).padStart(2, '0')
const isoLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const fmtD = (iso: string) => (iso ? `${Number(iso.slice(8))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}` : '—')

export const thisMonthStart = () => { const d = new Date(); return isoLocal(new Date(d.getFullYear(), d.getMonth(), 1)) }
export const thisMonthEnd = () => { const d = new Date(); return isoLocal(new Date(d.getFullYear(), d.getMonth() + 1, 0)) }

export type Range = { from: string; to: string; label: string; sub: string; steppable: boolean }

export function computeRange(period: Period, weekOff: number, monthOff: number, cFrom: string, cTo: string): Range {
  if (period === 'week') {
    const base = new Date()
    base.setDate(base.getDate() + weekOff * 7)
    const wk = weekDatesISO(base)
    return {
      from: wk[0], to: wk[6],
      label: `${fmtD(wk[0])} – ${fmtD(wk[6])}`,
      sub: weekOff === 0 ? 'This week' : weekOff === -1 ? 'Last week' : `${wk[0].slice(0, 4)}`,
      steppable: true,
    }
  }
  if (period === 'month') {
    const b = new Date()
    b.setDate(1)
    b.setMonth(b.getMonth() + monthOff)
    return {
      from: isoLocal(new Date(b.getFullYear(), b.getMonth(), 1)),
      to: isoLocal(new Date(b.getFullYear(), b.getMonth() + 1, 0)),
      label: `${MONTHS[b.getMonth()]} ${b.getFullYear()}`,
      sub: monthOff === 0 ? 'This month' : monthOff === -1 ? 'Last month' : '',
      steppable: true,
    }
  }
  const from = cFrom <= cTo ? cFrom : cTo
  const to = cFrom <= cTo ? cTo : cFrom
  return { from, to, label: `${fmtD(from)} – ${fmtD(to)}`, sub: 'Custom range', steppable: false }
}

export const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
