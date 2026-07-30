import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import { CalendarIcon, ClockIcon } from '../components/Icons'
import { useStore, useCurrentUser } from '../data/store'
import { weekDatesISO, todayISO, visitsForUser } from '../mobile/fieldHelpers'
import NewVisitSheet from './NewVisitSheet'
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
  const [adding, setAdding] = useState(false)

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
        <button className="ts-add" onClick={() => setAdding(true)}>+ Add to schedule</button>

        {visits.length === 0 ? (
          <div className="placeholder">
            <CalendarIcon size={44} />
            <h2>Nothing scheduled</h2>
            <p>Add a job, travel time or a shop trip for this day.</p>
          </div>
        ) : (
          <ul className="visit-list">
            {visits.map((v) => (
              <li
                key={v.id}
                className={`visit-card scheduled ${v.jobId ? '' : 'no-job'}`}
                onClick={() => v.jobId && nav(`/field/job/${v.jobId}`)}
              >
                <div className="visit-time">
                  <strong>{v.start}</strong>
                  <span className="visit-duration"><ClockIcon size={14} /> {v.end}</span>
                </div>
                <div className="visit-body">
                  <strong className="visit-client">{v.jobTitle}</strong>
                  {v.jobId ? (
                    <>
                      <span className="visit-service">{v.clientName}</span>
                      {v.address && <span className="visit-address">{v.address}</span>}
                    </>
                  ) : (
                    <span className="visit-service">{v.category ?? 'Other'}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {adding && <NewVisitSheet defaultDate={selected} onClose={() => setAdding(false)} />}
    </div>
  )
}
