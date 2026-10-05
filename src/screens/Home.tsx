import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlayIcon,
  ClockIcon,
  CalendarIcon,
  TruckIcon,
  ClipboardIcon,
  BriefcaseIcon,
  ListIcon,
  UserIcon,
  ReceiptIcon,
  ChevronRightIcon,
} from '../components/Icons'
import { useStore, useCurrentUser } from '../data/store'
import { useClock } from '../mobile/useClock'
import { useTrip } from '../mobile/useTrip'
import NotificationBell from '../components/NotificationBell'
import { greeting, firstName, fmtDay, fmtDayShort, todayISO, weekDatesISO, visitsForUser } from '../mobile/fieldHelpers'
import AddHoursSheet from './AddHoursSheet'
import './screens.css'
import './Home.css'

function formatElapsed(totalSeconds: number) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(totalSeconds / 3600))}:${pad(Math.floor((totalSeconds % 3600) / 60))}:${pad(totalSeconds % 60)}`
}

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const mapsLink = (address: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`

export default function Home() {
  const { state } = useStore()
  const { user, can } = useCurrentUser()
  const nav = useNavigate()
  const { clockedIn, elapsed, clockIn, clockOut } = useClock()
  const { trip, elapsed: tripElapsed } = useTrip()
  const [sheet, setSheet] = useState<'hours' | 'travel' | null>(null)

  const today = todayISO()
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const nowHM = hhmm(new Date())
  const dayLabel = (iso: string) => (iso === today ? 'Today' : iso === tomorrow ? 'Tomorrow' : fmtDayShort(iso))

  // Everything still to come: the visit happening now, then later ones on any day.
  const upcoming = (user ? visitsForUser(state, user.id) : []).filter(
    (v) => v.date > today || (v.date === today && v.end > nowHM),
  )
  const [nextVisit, ...later] = upcoming
  const isNow = !!nextVisit && nextVisit.date === today && nextVisit.start <= nowHM

  const week = weekDatesISO()
  const myEntries = state.timeEntries.filter((t) => user && t.employeeId === user.id && week.includes(t.date))
  const dayHours = week.map((d) => myEntries.filter((t) => t.date === d).reduce((s, t) => s + t.hours, 0))
  const weekHours = dayHours.reduce((s, h) => s + h, 0)
  const maxDay = Math.max(8, ...dayHours)
  const startedAt = clockedIn ? hhmm(new Date(Date.now() - elapsed * 1000)) : ''

  const openJobs = state.jobs.filter((j) => j.status !== 'Complete')
  const shortcuts = [
    { label: 'Current jobs', Icon: BriefcaseIcon, count: openJobs.filter((j) => j.status === 'Active').length, show: true, onClick: () => nav('/field/jobs?view=current') },
    { label: 'All jobs', Icon: ListIcon, count: openJobs.length, show: true, onClick: () => nav('/field/jobs') },
    { label: 'My jobs', Icon: UserIcon, count: openJobs.filter((j) => user && j.assignedTo.includes(user.id)).length, show: true, onClick: () => nav('/field/jobs?view=mine') },
    { label: 'Schedule', Icon: CalendarIcon, show: true, onClick: () => nav('/field/schedule') },
    { label: 'Timesheet', Icon: ReceiptIcon, show: true, onClick: () => nav('/field/timesheet') },
    { label: 'Clients', Icon: UserIcon, show: true, onClick: () => nav('/field/clients') },
    { label: 'GA1 reports', Icon: ClipboardIcon, show: can('view:ga1'), onClick: () => nav('/field/ga1') },
    { label: 'Add hours', Icon: ClockIcon, show: true, onClick: () => setSheet('hours') },
    { label: trip ? 'Finish trip' : 'Travel', Icon: TruckIcon, show: true, onClick: () => setSheet('travel') },
  ].filter((s) => s.show)

  return (
    <div className="home">
      <header className="home-top">
        <div>
          <span className="home-date">{fmtDay(today)}</span>
          <h1 className="home-greeting">{greeting()}, {firstName(user?.name) || 'there'}</h1>
        </div>
        <NotificationBell app="field" buttonClassName="sh-icon-btn" />
      </header>

      <div className="pad">
        {/* A trip that's under way: tap to finish it */}
        {trip && (
          <button className="trip-card" onClick={() => setSheet('travel')}>
            <TruckIcon size={22} />
            <div className="trip-card-info">
              <span className="trip-card-tag">Trip under way{trip.toPlace ? ` · to ${trip.toPlace}` : ''}</span>
              <strong>{formatElapsed(tripElapsed)}</strong>
            </div>
            <span className="trip-card-btn">Finish trip</span>
          </button>
        )}

        {/* Next scheduled job: the first thing on screen */}
        {nextVisit ? (
          <section className="next-card">
            <div className="next-head">
              <span className={`next-tag ${isNow ? 'now' : ''}`}>{isNow ? 'On now' : 'Next up'}</span>
              <span className="next-time">{dayLabel(nextVisit.date)} · {nextVisit.start} – {nextVisit.end}</span>
            </div>
            <strong className="next-title">{nextVisit.jobTitle}</strong>
            {(nextVisit.clientName || nextVisit.address) && (
              <span className="next-where">{[nextVisit.clientName, nextVisit.address].filter(Boolean).join(' · ')}</span>
            )}
            <div className="next-actions">
              {nextVisit.address && (
                <a className="next-btn" href={mapsLink(nextVisit.address)} target="_blank" rel="noreferrer">Directions</a>
              )}
              {nextVisit.jobId && (
                <button className="next-btn primary" onClick={() => nav(`/field/job/${nextVisit.jobId}`)}>Open job</button>
              )}
            </div>
          </section>
        ) : (
          <section className="next-card empty">
            <span className="next-tag">Next up</span>
            <strong className="next-title">Nothing scheduled</strong>
            <span className="next-where">You have no upcoming visits.</span>
          </section>
        )}

        {/* Upcoming after that */}
        {later.length > 0 && (
          <>
            <div className="section-head">
              <div className="section-title">Upcoming</div>
              <a className="link" onClick={() => nav('/field/schedule')}>Schedule</a>
            </div>
            <ul className="fld-visits">
              {later.slice(0, 3).map((v) => (
                <li key={v.id} className="fld-visit" onClick={() => v.jobId && nav(`/field/job/${v.jobId}`)}>
                  <div className="fld-visit-time"><strong>{v.start}</strong><span>{dayLabel(v.date)}</span></div>
                  <div className="fld-visit-body">
                    <strong>{v.jobTitle}</strong>
                    <span>{v.clientName}{v.address ? ` · ${v.address}` : ''}</span>
                  </div>
                  {v.jobId && <ChevronRightIcon size={20} className="todo-arrow" />}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Shortcuts to every part of the app */}
        <div className="section-head">
          <div className="section-title">Shortcuts</div>
        </div>
        <div className="quick-grid">
          {shortcuts.map(({ label, Icon, count, onClick }) => (
            <button key={label} className="quick-btn" onClick={onClick}>
              <span className="quick-icon"><Icon size={22} /></span>
              <span className="quick-label">{label}</span>
              {count != null && <span className="quick-count">{count}</span>}
            </button>
          ))}
        </div>

        {/* Clock in / out */}
        <section className={`clock-card ${clockedIn ? 'on' : ''}`}>
          <div className="clock-info">
            <span className="clock-status"><i />{clockedIn ? 'On the clock' : 'Off the clock'}</span>
            <strong className="clock-time">{clockedIn ? formatElapsed(elapsed) : 'Ready to start?'}</strong>
            {clockedIn && <span className="clock-sub">Since {startedAt}</span>}
          </div>
          <button className={`clockin-btn ${clockedIn ? 'out' : ''}`} onClick={clockedIn ? clockOut : clockIn}>
            <PlayIcon size={20} />
            {clockedIn ? 'Clock out' : 'Clock in'}
          </button>
        </section>

        {/* This week's hours */}
        <button className="week-card" onClick={() => nav('/field/timesheet')}>
          <div className="week-total"><strong>{weekHours.toFixed(1)}h</strong><span>this week</span></div>
          <div className="week-bars">
            {week.map((d, i) => (
              <div key={d} className={`week-bar ${d === today ? 'today' : ''}`}>
                <div className="week-bar-track">
                  <div className="week-bar-fill" style={{ height: `${(dayHours[i] / maxDay) * 100}%` }} />
                </div>
                <span>{DAY_LETTERS[i]}</span>
              </div>
            ))}
          </div>
        </button>
      </div>

      {sheet && <AddHoursSheet kind={sheet === 'travel' ? 'travel' : undefined} onClose={() => setSheet(null)} />}
    </div>
  )
}
