import { NavLink } from 'react-router-dom'
import {
  HomeIcon,
  CalendarIcon,
  ClockIcon,
  ClipboardIcon,
  SearchIcon,
  MoreDotsIcon,
} from './Icons'
import { useCurrentUser } from '../data/store'
import './TabBar.css'

export default function TabBar() {
  const { can } = useCurrentUser()

  const tabs = [
    { to: '/field', label: 'Home', Icon: HomeIcon, end: true, show: true },
    { to: '/field/schedule', label: 'Schedule', Icon: CalendarIcon, show: true },
    { to: '/field/timesheet', label: 'Hours', Icon: ClockIcon, show: true },
    { to: '/field/ga1', label: 'GA1', Icon: ClipboardIcon, show: can('view:ga1') },
    { to: '/field/search', label: 'Search', Icon: SearchIcon, show: true },
    { to: '/field/more', label: 'More', Icon: MoreDotsIcon, show: true },
  ].filter((t) => t.show)

  return (
    <nav className="tabbar">
      {tabs.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className="tab">
          {({ isActive }) => (
            <>
              <span className={`tab-indicator ${isActive ? 'on' : ''}`} />
              <Icon size={24} />
              <span className="tab-label">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
