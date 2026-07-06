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
  { to: '/field', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/field/schedule', label: 'Schedule', Icon: CalendarIcon },
  { to: '/field/timesheet', label: 'Timesheet', Icon: ClockIcon },
  { to: '/field/search', label: 'Search', Icon: SearchIcon },
  { to: '/field/more', label: 'More', Icon: MoreDotsIcon },
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
