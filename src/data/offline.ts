import { useEffect, useState } from 'react'
import type { Action } from './store'
import type { State } from './types'
import { persist } from './api'

// Offline support for the field app: cache the last-loaded state so the app
// opens instantly (and works with no signal), and queue write actions in an
// outbox that flushes to Supabase once the connection returns.

const CACHE_KEY = 'che-state-cache'
const OUTBOX_KEY = 'che-outbox'

// ---- State cache -----------------------------------------------------------

export function readCache(): State | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as State) : null
  } catch {
    return null
  }
}

export function writeCache(state: State) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state))
  } catch {
    /* quota / private mode — non-fatal */
  }
}

// ---- Write outbox ----------------------------------------------------------

// Actions that change server data. HYDRATE / SET_CURRENT_USER are local-only.
function isWrite(action: Action): boolean {
  return action.type !== 'HYDRATE' && action.type !== 'SET_CURRENT_USER'
}

export function readOutbox(): Action[] {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY)
    return raw ? (JSON.parse(raw) as Action[]) : []
  } catch {
    return []
  }
}

function writeOutbox(actions: Action[]) {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(actions))
  } catch {
    /* non-fatal */
  }
}

export function enqueue(action: Action) {
  if (!isWrite(action)) return
  writeOutbox([...readOutbox(), action])
}

export function outboxCount(): number {
  return readOutbox().length
}

let flushing = false

// Replay queued writes in order. Stops on the first failure and keeps the
// remaining actions (including the one that failed) for the next attempt.
export async function flushOutbox(): Promise<{ flushed: number; remaining: number }> {
  if (flushing) return { flushed: 0, remaining: outboxCount() }
  flushing = true
  let flushed = 0
  try {
    let queue = readOutbox()
    while (queue.length) {
      const [next, ...rest] = queue
      try {
        await persist(next)
      } catch {
        break // still offline / server error — leave the queue intact
      }
      queue = rest
      writeOutbox(queue)
      flushed++
    }
    return { flushed, remaining: queue.length }
  } finally {
    flushing = false
  }
}

// ---- Connectivity hook -----------------------------------------------------

export function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])
  return online
}
