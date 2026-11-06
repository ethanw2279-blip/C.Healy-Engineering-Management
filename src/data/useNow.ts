import { useEffect, useState } from 'react'

/** The current time, ticking every `ms` while `active` (for running timers). */
export function useNow(active: boolean, ms = 15_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [active, ms])
  return now
}
