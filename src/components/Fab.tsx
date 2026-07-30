import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon, BriefcaseIcon, UserIcon, ClipboardIcon, ClockIcon, CalendarIcon } from './Icons'
import { useCurrentUser } from '../data/store'
import AddHoursSheet from '../screens/AddHoursSheet'
import NewClientSheet from '../screens/NewClientSheet'
import NewJobSheet from '../screens/NewJobSheet'
import NewVisitSheet from '../screens/NewVisitSheet'
import './Fab.css'

type Sheet = 'menu' | 'hours' | 'visit' | 'client' | 'job' | null

export default function Fab() {
  const { can } = useCurrentUser()
  const nav = useNavigate()
  const [sheet, setSheet] = useState<Sheet>(null)

  const canManage = can('create:records')

  const actions = [
    { label: 'Add to schedule', Icon: CalendarIcon, show: true, onClick: () => setSheet('visit') },
    { label: 'Add hours', Icon: ClockIcon, show: true, onClick: () => setSheet('hours') },
    { label: 'New job', Icon: BriefcaseIcon, show: canManage, onClick: () => setSheet('job') },
    { label: 'New client', Icon: UserIcon, show: canManage, onClick: () => setSheet('client') },
    { label: 'New GA1 inspection', Icon: ClipboardIcon, show: can('view:ga1'), onClick: () => { setSheet(null); nav('/field/ga1/new') } },
  ].filter((a) => a.show)

  return (
    <>
      <button className="fab" aria-label="Create" onClick={() => setSheet('menu')}>
        <PlusIcon size={30} strokeWidth={2} />
      </button>

      {sheet === 'menu' && (
        <div className="sheet-overlay" onClick={() => setSheet(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h2 className="sheet-title">Create</h2>
            <ul className="fab-menu">
              {actions.map(({ label, Icon, onClick }) => (
                <li key={label} className="fab-menu-item" onClick={onClick}>
                  <span className="fab-menu-icon"><Icon size={22} /></span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {sheet === 'visit' && <NewVisitSheet onClose={() => setSheet(null)} />}
      {sheet === 'hours' && <AddHoursSheet onClose={() => setSheet(null)} />}
      {sheet === 'client' && <NewClientSheet onClose={() => setSheet(null)} />}
      {sheet === 'job' && <NewJobSheet onClose={() => setSheet(null)} />}
    </>
  )
}
