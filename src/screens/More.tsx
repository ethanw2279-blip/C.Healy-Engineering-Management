import ScreenHeader from '../components/ScreenHeader'
import {
  AppsIcon,
  MegaphoneIcon,
  ChatIcon,
  CardIcon,
  SparkleIcon,
  GiftIcon,
  HelpIcon,
  UserIcon,
  TeamIcon,
  BuildingIcon,
  SlidersIcon,
  LogoutIcon,
} from '../components/Icons'
import { useCurrentUser } from '../data/store'
import './screens.css'
import './More.css'

const groupA = [
  { label: 'Support', Icon: ChatIcon },
  { label: 'Subscription', Icon: CardIcon },
  { label: 'Product updates', Icon: SparkleIcon },
  { label: 'Refer a friend', Icon: GiftIcon },
  { label: 'About', Icon: HelpIcon },
]

export default function More() {
  const { user, role, can } = useCurrentUser()

  // "Manage team" is only shown to roles that can manage the team.
  const groupB = [
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
            <span>{role?.name} · Ethan Whitney Detailing</span>
          </div>
        </div>

        <div className="tile-row">
          <button className="tile">
            <AppsIcon size={28} />
            <span>Apps &amp; integrations</span>
          </button>
          <button className="tile">
            <MegaphoneIcon size={28} />
            <span>Marketing</span>
          </button>
        </div>

        <ul className="menu">
          {groupA.map(({ label, Icon }) => (
            <li key={label} className="menu-item">
              <Icon size={24} />
              <span>{label}</span>
            </li>
          ))}
        </ul>

        <div className="divider" />

        <ul className="menu">
          {groupB.map(({ label, Icon }) => (
            <li key={label} className="menu-item">
              <Icon size={24} />
              <span>{label}</span>
            </li>
          ))}
        </ul>

        <div className="divider" />

        <ul className="menu">
          <li className="menu-item danger">
            <LogoutIcon size={24} />
            <span>Logout</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
