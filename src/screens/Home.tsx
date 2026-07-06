import { BellIcon, SparkleIcon, PlayIcon, QuoteIcon, ListIcon, ArrowRightIcon } from '../components/Icons'
import './screens.css'
import './Home.css'

export default function Home() {
  return (
    <div className="home">
      {/* Map hero with greeting + clock-in card overlaid. */}
      <section className="home-hero">
        <div className="home-hero-top">
          <span className="home-date">Monday, July 6th</span>
          <div className="home-hero-actions">
            <button className="sh-icon-btn" aria-label="Notifications">
              <BellIcon size={22} />
            </button>
            <button className="sh-icon-btn" aria-label="AI assistant">
              <SparkleIcon size={20} />
            </button>
          </div>
        </div>

        <h1 className="home-greeting">Good afternoon, Ethan</h1>

        <div className="clockin-card">
          <span className="clockin-label">Let&apos;s get started</span>
          <button className="clockin-btn">
            <PlayIcon size={22} />
            Clock In
          </button>
        </div>

        <div className="visits-strip">
          <div className="visits-empty">No visits scheduled today</div>
          <button className="visits-viewall">View all ›</button>
        </div>
      </section>

      <div className="pad">
        {/* This week timesheet summary. */}
        <div className="section-head">
          <div>
            <div className="section-title">This week</div>
            <div className="muted-sub">Jul 5 - 11</div>
          </div>
          <a className="link">View timesheet</a>
        </div>
        <div className="week-row">
          <span>Total completed time</span>
          <strong>00:00</strong>
        </div>

        {/* To do list. */}
        <div className="section-head">
          <div className="section-title">To do</div>
        </div>
        <ul className="todo-list">
          <li className="todo-item">
            <span className="todo-icon quote">
              <QuoteIcon size={22} />
            </span>
            <div className="todo-text">
              <strong>Create a winning quote</strong>
              <span>Boost your revenue with custom quotes</span>
            </div>
            <ArrowRightIcon size={22} className="todo-arrow" />
          </li>
          <div className="divider" />
          <li className="todo-item">
            <span className="todo-icon">
              <ListIcon size={22} />
            </span>
            <div className="todo-text">
              <strong>Create a customized schedule for your business</strong>
              <span>See all your jobs at a glance</span>
            </div>
            <ArrowRightIcon size={22} className="todo-arrow" />
          </li>
        </ul>

        {/* Business health. */}
        <div className="section-head">
          <div className="section-title">Business health</div>
          <a className="link">View all</a>
        </div>
        <div className="health-row">
          <div className="health-info">
            <strong>Job value</strong>
            <span>This week (Jul 5 - 11)</span>
          </div>
          <div className="health-value">€0</div>
          <span className="health-pct">0%</span>
        </div>
        <div className="divider" />
        <div className="health-row">
          <div className="health-info">
            <strong>Visits scheduled</strong>
            <span>This week (Jul 5 - 11)</span>
          </div>
          <div className="health-value">0</div>
          <span className="health-pct">0%</span>
        </div>

        <button className="help-btn">Need Help?</button>
      </div>
    </div>
  )
}
