import { useEffect, useState } from 'react'
import { useCurrentUser } from '../data/store'

const KEY = 'field-team-view'
const EVENT = 'field-team-view-change'

// Managers (anyone whose role can approve timesheets) see the team side of the
// field app by default. They can flip back to their own view, and the choice
// is remembered on this phone and shared by every screen.
export function useTeamView() {
  const { can } = useCurrentUser()
  const isManager = can('approve:timesheets')

  const read = () => {
    try { return localStorage.getItem(KEY) !== 'me' } catch { return true }
  }
  const [teamPref, setTeamPref] = useState(read)

  useEffect(() => {
    const sync = () => setTeamPref(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const setTeamView = (team: boolean) => {
    try { localStorage.setItem(KEY, team ? 'team' : 'me') } catch { /* private mode */ }
    setTeamPref(team)
    window.dispatchEvent(new Event(EVENT))
  }

  return { isManager, teamView: isManager && teamPref, setTeamView }
}
