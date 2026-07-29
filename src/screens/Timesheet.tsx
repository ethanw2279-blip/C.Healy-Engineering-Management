import { useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { useStore, useCurrentUser } from '../data/store'
import { weekDatesISO, todayISO } from '../mobile/fieldHelpers'
import AddHoursSheet from './AddHoursSheet'
import './screens.css'
import './Timesheet.css'

const DOW_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function hoursLabel(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${hh}:${String(mm).padStart(2, '0')}`
}

export default function Timesheet() {
  const { state } = useStore()
  const { user } = useCurrentUser()
  const [adding, setAdding] = useState(false)
  const today = todayISO()
  const week = weekDatesISO()

  const hoursOn = (iso: string) =>
    state.timeEntries
      .filter((t) => user && t.employeeId === user.id && t.date === iso)
      .reduce((s, t) => s + t.hours, 0)

  const perDay = week.map((iso) => ({ iso, hours: hoursOn(iso) }))
  const total = perDay.reduce((s, d) => s + d.hours, 0)
  const maxH = Math.max(...perDay.map((d) => d.hours), 1)

  return (
    <div>
      <ScreenHeader title="Timesheet" />

      <div className="pad">
        <button className="ts-add" onClick={() => setAdding(true)}>+ Add hours manually</button>

        <div className="ts-summary">
          <div>
            <div className="ts-summary-title">This week</div>
            <div className="muted-sub">{MONTHS[Number(week[0].slice(5, 7)) - 1]} {Number(week[0].slice(8))} – {Number(week[6].slice(8))}</div>
          </div>
          <div className="ts-total">
            <span>Total</span>
            <strong>{hoursLabel(total)}</strong>
          </div>
        </div>

        <ul className="ts-list">
          {perDay.map(({ iso, hours }, i) => (
            <li key={iso} className={`ts-row ${hours === 0 ? 'empty' : ''}`}>
              <div className="ts-daycol">
                <strong>{DOW_LONG[i]}</strong>
                <span>{MONTHS[Number(iso.slice(5, 7)) - 1]} {Number(iso.slice(8))}{iso === today ? ' · Today' : ''}</span>
              </div>
              <div className="ts-bar-wrap">
                <div className="ts-bar" style={{ width: `${(hours / maxH) * 100}%` }} />
              </div>
              <div className="ts-hours">{hoursLabel(hours)}</div>
            </li>
          ))}
        </ul>
      </div>

      {adding && <AddHoursSheet onClose={() => setAdding(false)} />}
    </div>
  )
}
