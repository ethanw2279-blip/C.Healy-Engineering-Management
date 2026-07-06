import { NavLink } from 'react-router-dom'
import {
  HomeIcon,
  CalendarIcon,
  ClockIcon,
  SearchIcon,
  MoreDotsIcon,
} from './Icons'
import './TabBar.css'

const tabs = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/schedule', label: 'Schedule', Icon: CalendarIcon },
  { to: '/timesheet', label: 'Timesheet', Icon: ClockIcon },
  { to: '/search', label: 'Search', Icon: SearchIcon },
  { to: '/more', label: 'More', Icon: MoreDotsIcon },
]

export default function TabBar() {
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
