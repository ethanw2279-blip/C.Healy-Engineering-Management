import { useNavigate } from 'react-router-dom'
import { BellIcon, SparkleIcon, PlayIcon, ClockIcon, ArrowRightIcon } from '../components/Icons'
import { useStore, useCurrentUser } from '../data/store'
import { useClock } from '../mobile/useClock'
import { greeting, firstName, fmtDay, todayISO, weekDatesISO, visitsForUser } from '../mobile/fieldHelpers'
import './screens.css'
import './Home.css'

function formatElapsed(totalSeconds: number) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(totalSeconds / 3600))}:${pad(Math.floor((totalSeconds % 3600) / 60))}:${pad(totalSeconds % 60)}`
}

export default function Home() {
  const { state } = useStore()
  const { user } = useCurrentUser()
  const nav = useNavigate()
  const { clockedIn, elapsed, clockIn, clockOut } = useClock()

  const today = todayISO()
  const myVisits = user ? visitsForUser(state, user.id) : []
  const todaysVisits = myVisits.filter((v) => v.date === today)
  const week = weekDatesISO()
  const weekHours = state.timeEntries
    .filter((t) => user && t.employeeId === user.id && week.includes(t.date))
    .reduce((s, t) => s + t.hours, 0)

  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero-top">
          <span className="home-date">{fmtDay(today)}</span>
          <div className="home-hero-actions">
            <button className="sh-icon-btn" aria-label="Notifications"><BellIcon size={22} /></button>
            <button className="sh-icon-btn" aria-label="AI assistant"><SparkleIcon size={20} /></button>
          </div>
        </div>

        <h1 className="home-greeting">{greeting()}, {firstName(user?.name) || 'there'}</h1>

        <div className="clockin-card">
          <span className="clockin-label">{clockedIn ? formatElapsed(elapsed) : "Let's get started"}</span>
          <button className={`clockin-btn ${clockedIn ? 'out' : ''}`} onClick={clockedIn ? clockOut : clockIn}>
            <PlayIcon size={22} />
            {clockedIn ? 'Clock Out' : 'Clock In'}
          </button>
        </div>

        <div className="visits-strip">
          {todaysVisits.length === 0 ? (
            <div className="visits-empty">No visits scheduled today</div>
          ) : (
            <button className="visits-empty visits-count" onClick={() => nav('/field/schedule')}>
              {todaysVisits.length} visit{todaysVisits.length === 1 ? '' : 's'} today · tap to view
            </button>
          )}
        </div>
      </section>

      <div className="pad">
        {/* Today's visits */}
        <div className="section-head">
          <div className="section-title">Today's visits</div>
          <a className="link" onClick={() => nav('/field/schedule')}>Schedule</a>
        </div>
        {todaysVisits.length === 0 ? (
          <p className="muted-sub" style={{ paddingBottom: 12 }}>Nothing scheduled for you today.</p>
        ) : (
          <ul className="fld-visits">
            {todaysVisits.map((v) => (
              <li key={v.id} className="fld-visit" onClick={() => nav(`/field/job/${v.jobId}`)}>
                <div className="fld-visit-time"><strong>{v.start}</strong><span>{v.end}</span></div>
                <div className="fld-visit-body">
                  <strong>{v.jobTitle}</strong>
                  <span>{v.clientName}{v.address ? ` · ${v.address}` : ''}</span>
                </div>
                <ArrowRightIcon size={20} className="todo-arrow" />
              </li>
            ))}
          </ul>
        )}

        {/* This week hours */}
        <div className="section-head">
          <div><div className="section-title">This week</div><div className="muted-sub">Your logged hours</div></div>
          <a className="link" onClick={() => nav('/field/timesheet')}>Timesheet</a>
        </div>
        <div className="week-row">
          <span><ClockIcon size={18} /> Total completed time</span>
          <strong>{weekHours.toFixed(2)}h</strong>
        </div>

        <button className="help-btn" onClick={() => nav('/field/more')}>Need Help?</button>
      </div>
    </div>
  )
}
