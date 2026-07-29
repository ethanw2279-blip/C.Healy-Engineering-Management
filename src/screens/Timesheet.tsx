import { useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { useStore, useCurrentUser } from '../data/store'
import { weekDatesISO, todayISO } from '../mobile/fieldHelpers'
import AddHoursSheet from './AddHoursSheet'
import type { TimeEntry } from '../data/types'
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
  const [editing, setEditing] = useState<TimeEntry | null>(null)
  const today = todayISO()
  const week = weekDatesISO()

  const myWeekEntries = state.timeEntries
    .filter((t) => user && t.employeeId === user.id && week.includes(t.date))
    .sort((a, b) => b.date.localeCompare(a.date))

  const hoursOn = (iso: string) =>
    myWeekEntries.filter((t) => t.date === iso).reduce((s, t) => s + t.hours, 0)

  const perDay = week.map((iso) => ({ iso, hours: hoursOn(iso) }))
  const total = perDay.reduce((s, d) => s + d.hours, 0)
  const maxH = Math.max(...perDay.map((d) => d.hours), 1)
  const fmtShort = (iso: string) => `${DOW_LONG[(new Date(iso).getDay() + 6) % 7].slice(0, 3)} ${Number(iso.slice(8))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`

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

        {myWeekEntries.length > 0 && (
          <div className="ts-entries">
            <div className="ts-entries-title">Your entries</div>
            {myWeekEntries.map((t) => {
              const job = state.jobs.find((j) => j.id === t.jobId)
              const editable = !t.approved
              return (
                <button
                  key={t.id}
                  className={`ts-entry ${editable ? 'editable' : ''}`}
                  onClick={() => editable && setEditing(t)}
                >
                  <div className="ts-entry-body">
                    <strong>{fmtShort(t.date)}</strong>
                    <span>{job ? job.title : t.note || 'Time entry'}</span>
                  </div>
                  <div className="ts-entry-hours">{hoursLabel(t.hours)}</div>
                  {t.approved ? <span className="ts-entry-lock">Approved</span> : <span className="muted-sub" style={{ fontSize: 12 }}>Edit</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {adding && <AddHoursSheet onClose={() => setAdding(false)} />}
      {editing && <AddHoursSheet editing={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
