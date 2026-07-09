import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import { CalendarIcon, ClockIcon } from '../components/Icons'
import { useStore, useCurrentUser } from '../data/store'
import { weekDatesISO, todayISO, visitsForUser } from '../mobile/fieldHelpers'
import './screens.css'
import './Schedule.css'

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Schedule() {
  const { state } = useStore()
  const { user } = useCurrentUser()
  const nav = useNavigate()
  const today = todayISO()
  const week = weekDatesISO()
  const [selected, setSelected] = useState(week.includes(today) ? today : week[0])

  const myVisits = user ? visitsForUser(state, user.id) : []
  const visits = myVisits.filter((v) => v.date === selected)

  return (
    <div>
      <ScreenHeader title="Schedule" />

      <div className="week-strip">
        {week.map((iso, i) => {
          const day = Number(iso.slice(8, 10))
          const count = myVisits.filter((v) => v.date === iso).length
          return (
            <button key={iso} className={`day-pill ${selected === iso ? 'on' : ''}`} onClick={() => setSelected(iso)}>
              <span className="day-label">{DOW[i]}</span>
              <span className="day-num">
                {day}
                {iso === today && <span className="today-dot" />}
              </span>
              {count > 0 && <span className="day-count">{count}</span>}
            </button>
          )
        })}
      </div>

      <div className="divider" />

      <div className="pad">
        {visits.length === 0 ? (
          <div className="placeholder">
            <CalendarIcon size={44} />
            <h2>No visits</h2>
            <p>You have nothing scheduled for this day.</p>
          </div>
        ) : (
          <ul className="visit-list">
            {visits.map((v) => (
              <li key={v.id} className="visit-card scheduled" onClick={() => nav(`/field/job/${v.jobId}`)}>
                <div className="visit-time">
                  <strong>{v.start}</strong>
                  <span className="visit-duration"><ClockIcon size={14} /> {v.end}</span>
                </div>
                <div className="visit-body">
                  <strong className="visit-client">{v.jobTitle}</strong>
                  <span className="visit-service">{v.clientName}</span>
                  {v.address && <span className="visit-address">{v.address}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
