import ScreenHeader from '../components/ScreenHeader'
import './screens.css'
import './Timesheet.css'

type Day = { label: string; date: number; minutes: number; note?: string }

const days: Day[] = [
  { label: 'Sunday', date: 5, minutes: 0 },
  { label: 'Monday', date: 6, minutes: 0, note: 'Today' },
  { label: 'Tuesday', date: 7, minutes: 210, note: 'Whitney · Reilly' },
  { label: 'Wednesday', date: 8, minutes: 0 },
  { label: 'Thursday', date: 9, minutes: 180, note: 'Dublin Fleet Co.' },
  { label: 'Friday', date: 10, minutes: 0 },
  { label: 'Saturday', date: 11, minutes: 0 },
]

function hm(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

const maxMinutes = Math.max(...days.map((d) => d.minutes), 1)

export default function Timesheet() {
  const total = days.reduce((sum, d) => sum + d.minutes, 0)

  return (
    <div>
      <ScreenHeader title="Timesheet" />

      <div className="pad">
        <div className="ts-summary">
          <div>
            <div className="ts-summary-title">This week</div>
            <div className="muted-sub">Jul 5 - 11</div>
          </div>
          <div className="ts-total">
            <span>Total</span>
            <strong>{hm(total)}</strong>
          </div>
        </div>

        <ul className="ts-list">
          {days.map((d) => (
            <li key={d.date} className={`ts-row ${d.minutes === 0 ? 'empty' : ''}`}>
              <div className="ts-daycol">
                <strong>{d.label}</strong>
                <span>
                  Jul {d.date}
                  {d.note ? ` · ${d.note}` : ''}
                </span>
              </div>
              <div className="ts-bar-wrap">
                <div
                  className="ts-bar"
                  style={{ width: `${(d.minutes / maxMinutes) * 100}%` }}
                />
              </div>
              <div className="ts-hours">{hm(d.minutes)}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
