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
import './screens.css'
import './More.css'

const groupA = [
  { label: 'Support', Icon: ChatIcon },
  { label: 'Subscription', Icon: CardIcon },
  { label: 'Product updates', Icon: SparkleIcon },
  { label: 'Refer a friend', Icon: GiftIcon },
  { label: 'About', Icon: HelpIcon },
]

const groupB = [
  { label: 'Profile', Icon: UserIcon },
  { label: 'Manage team', Icon: TeamIcon },
  { label: 'Company details', Icon: BuildingIcon },
  { label: 'Preferences', Icon: SlidersIcon },
]

export default function More() {
  return (
    <div>
      <ScreenHeader title="More" />

      <div className="pad">
        <div className="company-name">Ethan Whitney Detailing</div>

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
