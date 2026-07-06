import { NavLink } from 'react-router-dom'
import {
  GridIcon,
  CalendarIcon,
  UserIcon,
  RequestsIcon,
  QuoteIcon,
  BriefcaseIcon,
  ReceiptIcon,
  ClockIcon,
  TeamIcon,
  ChartIcon,
} from '../components/Icons'
import { Avatar } from './components/ui'

const nav = [
  { to: '/', label: 'Dashboard', Icon: GridIcon, end: true },
  { to: '/schedule', label: 'Schedule', Icon: CalendarIcon },
  { to: '/clients', label: 'Clients', Icon: UserIcon },
  { to: '/requests', label: 'Requests', Icon: RequestsIcon },
  { to: '/quotes', label: 'Quotes', Icon: QuoteIcon },
  { to: '/jobs', label: 'Jobs', Icon: BriefcaseIcon },
  { to: '/invoices', label: 'Invoices', Icon: ReceiptIcon },
  { to: '/timesheets', label: 'Timesheets', Icon: ClockIcon },
  { to: '/team', label: 'Team', Icon: TeamIcon },
  { to: '/reports', label: 'Reports', Icon: ChartIcon },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">J</span>
        <div className="brand-text">
          <strong>Jobber</strong>
          <span>Ethan Whitney Detailing</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {nav.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="side-link">
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <NavLink to="/field" className="side-link side-link-alt">
        <ClockIcon size={20} />
        <span>Field app ↗</span>
      </NavLink>

      <div className="sidebar-user">
        <Avatar name="Ethan Whitney" color="#1F8A4C" size={34} />
        <div className="sidebar-user-text">
          <strong>Ethan Whitney</strong>
          <span>Owner</span>
        </div>
      </div>
    </aside>
  )
}
