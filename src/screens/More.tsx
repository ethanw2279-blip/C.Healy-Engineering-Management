import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import {
  UserIcon,
  BriefcaseIcon,
  ClipboardIcon,
  TeamIcon,
  BuildingIcon,
  SlidersIcon,
  BellIcon,
  GridIcon,
  LogoutIcon,
} from '../components/Icons'
import { useCurrentUser } from '../data/store'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { isPushConfigured, isSubscribed, subscribe, unsubscribe } from '../lib/push'
import { useAuth } from '../auth/AuthProvider'
import './screens.css'
import './More.css'

export default function More() {
  const { user, role, can } = useCurrentUser()
  const { signOut } = useAuth()
  const nav = useNavigate()

  const [pushOn, setPushOn] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)

  useEffect(() => {
    if (isPushConfigured) isSubscribed().then(setPushOn)
  }, [])

  const togglePush = async () => {
    if (!user || pushBusy) return
    setPushBusy(true)
    try {
      if (pushOn) {
        await unsubscribe()
        setPushOn(false)
      } else {
        await subscribe(user.id)
        setPushOn(true)
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not update notifications.')
    } finally {
      setPushBusy(false)
    }
  }

  // Switch to the office/admin app. Set the flag so the phone-redirect on "/"
  // doesn't bounce straight back here.
  const openOffice = () => {
    try { sessionStorage.setItem('preferOffice', '1') } catch { /* private mode */ }
    nav('/')
  }

  const menu = [
    { label: 'GA1 Inspections', Icon: ClipboardIcon, show: can('view:ga1'), onClick: () => nav('/field/ga1') },
    { label: 'Office app', Icon: GridIcon, show: can('view:dashboard'), onClick: openOffice },
    { label: 'Profile', Icon: UserIcon, show: true },
    { label: 'Manage team', Icon: TeamIcon, show: can('manage:team') },
    { label: 'Company details', Icon: BuildingIcon, show: true },
    { label: 'Preferences', Icon: SlidersIcon, show: true },
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
          {isPushConfigured && (
            <li className="menu-item" onClick={togglePush}>
              <BellIcon size={24} />
              <span>Push notifications</span>
              <span className={`push-state ${pushOn ? 'on' : ''}`}>{pushBusy ? '…' : pushOn ? 'On' : 'Off'}</span>
            </li>
          )}
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
