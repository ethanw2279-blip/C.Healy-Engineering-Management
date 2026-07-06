// Small date helpers for the Schedule calendar. Weeks start on Monday.

export const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const parseYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (d: Date, n: number) => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export const addMonths = (d: Date, n: number) => {
  const r = new Date(d)
  r.setDate(1)
  r.setMonth(r.getMonth() + n)
  return r
}

export const isSameDay = (a: Date, b: Date) => ymd(a) === ymd(b)

// Monday as the first day of the week.
export const startOfWeek = (d: Date) => {
  const r = new Date(d)
  const day = (r.getDay() + 6) % 7 // 0 = Monday
  r.setDate(r.getDate() - day)
  r.setHours(0, 0, 0, 0)
  return r
}

export const weekDays = (d: Date) => {
  const start = startOfWeek(d)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

// 6-row grid (Mon–Sun) covering the month that `d` falls in.
export const monthMatrix = (d: Date) => {
  const first = new Date(d.getFullYear(), d.getMonth(), 1)
  const gridStart = startOfWeek(first)
  return Array.from({ length: 6 }, (_, w) =>
    Array.from({ length: 7 }, (_, i) => addDays(gridStart, w * 7 + i)),
  )
}

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const fmtLong = (d: Date) =>
  d.toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
