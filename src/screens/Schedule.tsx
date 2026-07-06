import { useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { CalendarIcon, ClockIcon, UserIcon } from '../components/Icons'
import './screens.css'
import './Schedule.css'

type Visit = {
  time: string
  duration: string
  client: string
  service: string
  address: string
  status: 'scheduled' | 'unassigned'
}

// Sample week starting Sunday Jul 5. Today (index 1, Mon Jul 6) has no visits,
// matching the Home screen's "No visits scheduled today".
const week = [
  { label: 'Sun', date: 5 },
  { label: 'Mon', date: 6 },
  { label: 'Tue', date: 7 },
  { label: 'Wed', date: 8 },
  { label: 'Thu', date: 9 },
  { label: 'Fri', date: 10 },
  { label: 'Sat', date: 11 },
]

const visitsByDate: Record<number, Visit[]> = {
  7: [
    {
      time: '9:00 AM',
      duration: '2h',
      client: 'Ethan Whitney',
      service: 'Full exterior detail',
      address: '2426 E Riverside Dr',
      status: 'scheduled',
    },
    {
      time: '1:30 PM',
      duration: '1h 30m',
      client: 'Marcus Reilly',
      service: 'Interior deep clean',
      address: '18 Fairview Ave',
      status: 'scheduled',
    },
  ],
  9: [
    {
      time: '11:00 AM',
      duration: '3h',
      client: 'Dublin Fleet Co.',
      service: 'Fleet wash · 4 vehicles',
      address: 'Point Village Depot',
      status: 'unassigned',
    },
  ],
}

export default function Schedule() {
  const today = 6
  const [selected, setSelected] = useState(7)
  const visits = visitsByDate[selected] ?? []

  return (
    <div>
      <ScreenHeader title="Schedule" />

      <div className="week-strip">
        {week.map((d) => (
          <button
            key={d.date}
            className={`day-pill ${selected === d.date ? 'on' : ''}`}
            onClick={() => setSelected(d.date)}
          >
            <span className="day-label">{d.label}</span>
            <span className="day-num">
              {d.date}
              {d.date === today && <span className="today-dot" />}
            </span>
          </button>
        ))}
      </div>

      <div className="divider" />

      <div className="pad">
        {visits.length === 0 ? (
          <div className="placeholder">
            <CalendarIcon size={44} />
            <h2>No visits scheduled</h2>
            <p>Tap the + button to schedule a job or visit for this day.</p>
          </div>
        ) : (
          <ul className="visit-list">
            {visits.map((v, i) => (
              <li key={i} className={`visit-card ${v.status}`}>
                <div className="visit-time">
                  <strong>{v.time}</strong>
                  <span className="visit-duration">
                    <ClockIcon size={14} /> {v.duration}
                  </span>
                </div>
                <div className="visit-body">
                  <strong className="visit-client">
                    <UserIcon size={18} /> {v.client}
                  </strong>
                  <span className="visit-service">{v.service}</span>
                  <span className="visit-address">{v.address}</span>
                  <span className={`visit-status ${v.status}`}>
                    {v.status === 'unassigned' ? 'Unassigned' : 'Scheduled'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
