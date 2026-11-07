import { useTeamView } from '../mobile/useTeamView'
import './ViewSwitch.css'

// "Team / Me" toggle shown at the top of screens that have a manager version.
// Renders nothing for staff who aren't managers.
export default function ViewSwitch() {
  const { isManager, teamView, setTeamView } = useTeamView()
  if (!isManager) return null
  return (
    <div className="view-switch" role="tablist" aria-label="Whose view">
      <button role="tab" aria-selected={teamView} className={teamView ? 'on' : ''} onClick={() => setTeamView(true)}>Team</button>
      <button role="tab" aria-selected={!teamView} className={!teamView ? 'on' : ''} onClick={() => setTeamView(false)}>Me</button>
    </div>
  )
}
