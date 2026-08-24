import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, useCurrentUser, eur } from '../data/store'
import { weekDatesISO } from '../mobile/fieldHelpers'
import { weekPayFor, type PayBreakdown, type PaySlice } from '../data/pay'
import './screens.css'
import './field.css'
import './Timesheet.css'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const hoursLabel = (h: number) => {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${hh}:${String(mm).padStart(2, '0')}`
}

const weekLabel = (week: string[]) => {
  const a = week[0]
  const b = week[6]
  const am = MONTHS[Number(a.slice(5, 7)) - 1]
  const bm = MONTHS[Number(b.slice(5, 7)) - 1]
  return am === bm
    ? `${am} ${Number(a.slice(8))} – ${Number(b.slice(8))}`
    : `${am} ${Number(a.slice(8))} – ${bm} ${Number(b.slice(8))}`
}

// One gross-pay section (Total / Working / Travel), showing approved vs pending.
function PaySection({ title, tone, data }: { title: string; tone: string; data: { approved: PaySlice; pending: PaySlice } }) {
  const gross = data.approved.gross + data.pending.gross
  const row = (label: string, slice: PaySlice, cls: string) => (
    <div className={`pay-line ${cls}`}>
      <span className="pay-line-label">{label}</span>
      <span className="pay-line-hours">{hoursLabel(slice.hours)}</span>
      <strong className="pay-line-gross">{eur(slice.gross)}</strong>
    </div>
  )
  return (
    <div className="pay-card">
      <div className="pay-card-head">
        <span className={`pay-dot pay-dot-${tone}`} />
        <h3>{title}</h3>
        <strong className="pay-card-total">{eur(gross)}</strong>
      </div>
      {row('Approved', data.approved, 'approved')}
      {row('Pending approval', data.pending, 'pending')}
    </div>
  )
}

export default function TimesheetPay() {
  const { state } = useStore()
  const { user } = useCurrentUser()
  const nav = useNavigate()
  const [offset, setOffset] = useState(0) // weeks back/forward from the current week

  const base = new Date()
  base.setDate(base.getDate() + offset * 7)
  const week = weekDatesISO(base)

  const pay: PayBreakdown = user
    ? weekPayFor(state, user.id, week)
    : {
        working: { approved: { hours: 0, gross: 0 }, pending: { hours: 0, gross: 0 } },
        travel: { approved: { hours: 0, gross: 0 }, pending: { hours: 0, gross: 0 } },
        total: { approved: { hours: 0, gross: 0 }, pending: { hours: 0, gross: 0 } },
      }

  const grand = pay.total.approved.gross + pay.total.pending.gross

  return (
    <div>
      <div className="fld-topbar">
        <div className="fld-topbar-left">
          <button className="fld-back" onClick={() => nav(-1)}>←</button>
          <span>Your pay</span>
        </div>
      </div>

      <div className="pad">
        <div className="pay-weeknav">
          <button className="pay-week-btn" onClick={() => setOffset((o) => o - 1)} aria-label="Previous week">‹</button>
          <div className="pay-week-mid">
            <strong>{offset === 0 ? 'This week' : offset === -1 ? 'Last week' : weekLabel(week)}</strong>
            <span className="muted-sub">{weekLabel(week)}</span>
          </div>
          <button className="pay-week-btn" onClick={() => setOffset((o) => o + 1)} disabled={offset >= 0} aria-label="Next week">›</button>
        </div>

        <div className="pay-grand">
          <span>Total gross pay</span>
          <strong>{eur(grand)}</strong>
        </div>

        <PaySection title="Total gross pay" tone="total" data={pay.total} />
        <PaySection title="Working gross pay" tone="work" data={pay.working} />
        <PaySection title="Travel gross pay" tone="travel" data={pay.travel} />

        <p className="muted-sub pay-note">
          Gross figures only, before tax and deductions. Pending hours are awaiting office approval and may still change.
        </p>
      </div>
    </div>
  )
}
