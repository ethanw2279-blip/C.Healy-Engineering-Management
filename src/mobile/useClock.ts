import { useEffect, useState } from 'react'
import { useStore, useCurrentUser, newId } from '../data/store'

const todayISO = () => new Date().toISOString().slice(0, 10)

// A field clock that survives tab switches and reloads (kept in localStorage).
// Clocking out logs a real time entry against the signed-in employee.
export function useClock() {
  const { dispatch } = useStore()
  const { user } = useCurrentUser()
  const key = `field-clock-${user?.id ?? 'anon'}`

  const [startedAt, setStartedAt] = useState<number | null>(() => {
    const v = localStorage.getItem(key)
    return v ? Number(v) : null
  })
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (startedAt == null) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [startedAt])

  const clockIn = () => {
    const t = Date.now()
    localStorage.setItem(key, String(t))
    setStartedAt(t)
  }

  const clockOut = () => {
    if (startedAt == null || !user) return
    const hours = Math.round(((Date.now() - startedAt) / 3600000) * 100) / 100
    dispatch({
      type: 'ADD_TIME_ENTRY',
      entry: { id: newId('t'), employeeId: user.id, date: todayISO(), hours, kind: 'work', note: 'Clocked via mobile', approved: false },
    })
    localStorage.removeItem(key)
    setStartedAt(null)
  }

  const elapsed = startedAt == null ? 0 : Math.floor((now - startedAt) / 1000)
  return { clockedIn: startedAt != null, elapsed, clockIn, clockOut }
}
