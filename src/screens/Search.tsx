import ScreenHeader from '../components/ScreenHeader'
import { SearchIcon, UserIcon, RequestsIcon, QuoteIcon } from '../components/Icons'
import './screens.css'
import './Search.css'

const filters = [
  { label: 'Clients', Icon: UserIcon, color: 'var(--navy)' },
  { label: 'Requests', Icon: RequestsIcon, color: 'var(--amber)' },
  { label: 'Quotes', Icon: QuoteIcon, color: '#7a2b3a' },
]

export default function Search() {
  return (
    <div>
      <ScreenHeader title="Search" />

      <div className="pad">
        <div className="search-box">
          <SearchIcon size={22} />
          <input placeholder="Search" />
        </div>

        <div className="filter-row">
          {filters.map(({ label, Icon, color }) => (
            <button key={label} className="filter-chip">
              <span style={{ color }}>
                <Icon size={20} />
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="divider" />

      <div className="pad">
        <h3 className="recent-title">Recently active</h3>
        <button className="result-row">
          <span className="result-avatar">
            <UserIcon size={26} />
          </span>
          <div className="result-info">
            <strong>Ethan Whitney</strong>
            <span>Today | 2426 E Riverside Dr</span>
          </div>
          <div className="result-tag">
            Lead <span className="tag-dot" />
          </div>
        </button>
      </div>
    </div>
  )
}
