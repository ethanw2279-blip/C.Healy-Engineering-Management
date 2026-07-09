import { NavLink } from 'react-router-dom'
import { ClockIcon } from '../components/Icons'
import { Avatar } from './components/ui'
import { NAV } from './nav'
import { useCurrentUser } from '../data/store'
import { COMPANY } from '../data/company'

export default function Sidebar() {
  const { user, role, can } = useCurrentUser()
  const items = NAV.filter((n) => can(n.perm))

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img className="brand-mark" src="/logo-mark.png" alt={COMPANY.name} />
        <div className="brand-text">
          <strong>{COMPANY.name}</strong>
          <span>{COMPANY.tagline}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map(({ to, label, Icon, end }) => (
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
        <Avatar name={user?.name ?? '?'} color={user?.color} size={34} />
        <div className="sidebar-user-text">
          <strong>{user?.name}</strong>
          <span>{role?.name ?? 'No role'}</span>
        </div>
      </div>
    </aside>
  )
}
