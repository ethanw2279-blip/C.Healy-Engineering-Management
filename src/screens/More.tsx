import { useNavigate } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import {
  UserIcon,
  BriefcaseIcon,
  ClipboardIcon,
  TeamIcon,
  BuildingIcon,
  SlidersIcon,
  GridIcon,
  BoxIcon,
  ListIcon,
  LogoutIcon,
} from '../components/Icons'
import { useCurrentUser } from '../data/store'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import ThemeToggle from '../theme/ThemeToggle'
import './screens.css'
import './More.css'

export default function More() {
  const { user, role, can } = useCurrentUser()
  const { signOut } = useAuth()
  const nav = useNavigate()

  // Switch to the office/admin app. Set the flag so the phone-redirect on "/"
  // doesn't bounce straight back here.
  const openOffice = () => {
    try { sessionStorage.setItem('preferOffice', '1') } catch { /* private mode */ }
    nav('/')
  }

  const menu = [
    { label: 'Stock', Icon: BoxIcon, show: can('view:stock') || can('create:records'), onClick: () => nav('/field/stock') },
    { label: 'Shopping list', Icon: ListIcon, show: can('view:stock') || can('create:records'), onClick: () => nav('/field/shopping') },
    { label: 'GA1 Inspections', Icon: ClipboardIcon, show: can('view:ga1'), onClick: () => nav('/field/ga1') },
    { label: 'Office app', Icon: GridIcon, show: can('view:dashboard'), onClick: openOffice },
    { label: 'Profile', Icon: UserIcon, show: true },
    { label: 'Manage team', Icon: TeamIcon, show: can('manage:team') },
    { label: 'Company details', Icon: BuildingIcon, show: true },
    { label: 'Preferences', Icon: SlidersIcon, show: true, onClick: () => nav('/field/preferences') },
  ].filter((i) => i.show)

  return (
    <div>
      <ScreenHeader title="More" />

      <div className="pad">
        <div className="user-chip">
          <div className="user-chip-avatar">{(user?.name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('')}</div>
          <div className="user-chip-text">
            <strong>{user?.name}</strong>
            <span>{role?.name} · C.Healy Engineering</span>
          </div>
        </div>

        <div className="tile-row">
          <button className="tile" onClick={() => nav('/field/clients')}>
            <UserIcon size={28} />
            <span>All clients</span>
          </button>
          <button className="tile" onClick={() => nav('/field/jobs')}>
            <BriefcaseIcon size={28} />
            <span>All jobs</span>
          </button>
        </div>

        <ul className="menu">
          {menu.map(({ label, Icon, onClick }) => (
            <li key={label} className="menu-item" onClick={onClick}>
              <Icon size={24} />
              <span>{label}</span>
            </li>
          ))}
          <ThemeToggle variant="menu" />
        </ul>

        <div className="divider" />

        <ul className="menu">
          <li className="menu-item danger" onClick={() => isSupabaseConfigured && signOut()}>
            <LogoutIcon size={24} />
            <span>Logout</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
