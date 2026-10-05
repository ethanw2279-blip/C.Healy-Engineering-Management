import { useEffect, useState } from 'react'
import { useCurrentUser } from '../data/store'

// A trip that's under way: started from the Travel sheet with "Start trip",
// finished later from the same sheet. Kept in localStorage (like the field
// clock) so it survives reloads and the phone locking.
export type RunningTrip = {
  startedAt: number // ms timestamp
  reason?: string
  jobId?: string
  fromPlace?: string
  toPlace?: string
}

const CHANGE = 'field-trip-change'

function read(key: string): RunningTrip | null {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as RunningTrip) : null
  } catch {
    return null
  }
}

export function useTrip() {
  const { user } = useCurrentUser()
  const key = `field-trip-${user?.id ?? 'anon'}`
  const [trip, setTrip] = useState<RunningTrip | null>(() => read(key))
  const [now, setNow] = useState(Date.now())

  // Keep every screen using this hook in step (home card, travel sheet).
  useEffect(() => {
    const sync = () => setTrip(read(key))
    sync()
    window.addEventListener(CHANGE, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(CHANGE, sync)
      window.removeEventListener('storage', sync)
    }
  }, [key])

  useEffect(() => {
    if (!trip) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [trip])

  const write = (t: RunningTrip | null) => {
    try {
      if (t) localStorage.setItem(key, JSON.stringify(t))
      else localStorage.removeItem(key)
    } catch {
      /* private mode — the trip just won't survive a reload */
    }
    setTrip(t)
    window.dispatchEvent(new Event(CHANGE))
  }

  const startTrip = (details: Omit<RunningTrip, 'startedAt'>) => write({ ...details, startedAt: Date.now() })
  const endTrip = () => write(null)

  const elapsed = trip ? Math.max(0, Math.floor((now - trip.startedAt) / 1000)) : 0
  return { trip, elapsed, startTrip, endTrip }
}
