import { useMemo, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import ViewSwitch from '../components/ViewSwitch'
import { ChevronDownIcon } from '../components/Icons'
import { useStore, eur, roleNameOf } from '../data/store'
import { computeRange, thisMonthStart, thisMonthEnd, type Period } from '../data/hoursRange'
import { fmtDayShort, timeRange, hrsText } from '../mobile/fieldHelpers'
import type { TimeEntry, TimeEntryKind } from '../data/types'
import './screens.css'
import './Timesheet.css'
import './TeamHours.css'

type SortKey = 'most' | 'least' | 'pending' | 'name'
type TypeFilter = 'all' | TimeEntryKind

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'most', label: 'Most hours' },
  { key: 'least', label: 'Least hours' },
  { key: 'pending', label: 'Most to approve' },
  { key: 'name', label: 'Name A–Z' },
]

function hoursLabel(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${hh}:${String(mm).padStart(2, '0')}`
}

const initials = (name: string) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
const sum = (es: TimeEntry[]) => es.reduce((s, e) => s + e.hours, 0)

// Manager version of the Hours tab: every employee's hours for a period, with
// sorting, filters and approvals. The office Timesheets page on a phone.
export default function TeamHours() {
  const { state, dispatch } = useStore()

  const [period, setPeriod] = useState<Period>('week')
  const [weekOff, setWeekOff] = useState(0)
  const [monthOff, setMonthOff] = useState(0)
  const [cFrom, setCFrom] = useState(thisMonthStart)
  const [cTo, setCTo] = useState(thisMonthEnd)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [pendingOnly, setPendingOnly] = useState(false)
  const [sort, setSort] = useState<SortKey>('most')
  const [open, setOpen] = useState<string | null>(null)

  const range = computeRange(period, weekOff, monthOff, cFrom, cTo)

  const entries = useMemo(
    () =>
      state.timeEntries
        .filter((t) => t.date >= range.from && t.date <= range.to)
        .filter((t) => typeFilter === 'all' || t.kind === typeFilter)
        .sort((a, b) => b.date.localeCompare(a.date) || (b.startTime ?? '').localeCompare(a.startTime ?? '')),
    [state.timeEntries, range.from, range.to, typeFilter],
  )

  const rateFor = (e: TimeEntry) => {
    const emp = state.employees.find((x) => x.id === e.employeeId)
    return e.kind === 'travel' ? emp?.travelRate ?? 0 : emp?.hourlyRate ?? 0
  }

  const people = state.employees
    .filter((emp) => emp.active || entries.some((e) => e.employeeId === emp.id))
    .map((emp) => {
      const es = entries.filter((e) => e.employeeId === emp.id)
      const pend = es.filter((e) => !e.approved)
      const labour = sum(es.filter((e) => e.kind === 'work'))
      const travel = sum(es.filter((e) => e.kind === 'travel'))
      return {
        emp,
        es,
        labour,
        travel,
        total: labour + travel,
        pendHrs: sum(pend),
        pendIds: pend.map((e) => e.id),
        gross: es.reduce((s, e) => s + e.hours * rateFor(e), 0),
      }
    })
    .filter((p) => !pendingOnly || p.pendIds.length > 0)
    .sort((a, b) => {
      if (sort === 'name') return a.emp.name.localeCompare(b.emp.name)
      if (sort === 'least') return a.total - b.total || a.emp.name.localeCompare(b.emp.name)
      if (sort === 'pending') return b.pendHrs - a.pendHrs || b.total - a.total
      return b.total - a.total || a.emp.name.localeCompare(b.emp.name)
    })

  const labourAll = sum(entries.filter((e) => e.kind === 'work'))
  const travelAll = sum(entries.filter((e) => e.kind === 'travel'))
  const pendingAll = entries.filter((e) => !e.approved)
  const maxTotal = Math.max(1, ...people.map((p) => p.total))
  const logged = people.filter((p) => p.total > 0).length

  const approve = (ids: string[]) => ids.forEach((id) => dispatch({ type: 'APPROVE_TIME', id }))
  const step = (dir: 1 | -1) => (period === 'week' ? setWeekOff((o) => o + dir) : setMonthOff((o) => o + dir))
  const nextDisabled = period === 'week' ? weekOff >= 0 : monthOff >= 0

  return (
    <div>
      <ScreenHeader title="Team hours" />

      <div className="pad">
        <ViewSwitch />

        <div className="th-seg">
          {(['week', 'month', 'custom'] as Period[]).map((p) => (
            <button key={p} className={period === p ? 'on' : ''} onClick={() => setPeriod(p)}>
              {p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'Custom'}
            </button>
          ))}
        </div>

        {period === 'custom' ? (
          <div className="th-dates">
            <input type="date" value={cFrom} max={cTo} onChange={(e) => setCFrom(e.target.value)} aria-label="From" />
            <span>–</span>
            <input type="date" value={cTo} min={cFrom} onChange={(e) => setCTo(e.target.value)} aria-label="To" />
          </div>
        ) : (
          <div className="pay-weeknav">
            <button className="pay-week-btn" onClick={() => step(-1)} aria-label="Previous">‹</button>
            <div className="pay-week-mid">
              <strong>{range.label}</strong>
              {range.sub && <span className="muted-sub">{range.sub}</span>}
            </div>
            <button className="pay-week-btn" onClick={() => step(1)} disabled={nextDisabled} aria-label="Next">›</button>
          </div>
        )}

        <section className="th-summary">
          <div className="th-summary-top">
            <div>
              <span className="th-summary-label">Team total</span>
              <strong className="th-summary-total">{hoursLabel(labourAll + travelAll)}</strong>
            </div>
            <div className="th-summary-staff">
              <strong>{logged}</strong>
              <span>{logged === 1 ? 'person' : 'people'} logged</span>
            </div>
          </div>
          <div className="th-summary-stats">
            <div><i className="pay-dot pay-dot-work" /> Labour <b>{hoursLabel(labourAll)}</b></div>
            <div><i className="pay-dot pay-dot-travel" /> Travel <b>{hoursLabel(travelAll)}</b></div>
          </div>
          {pendingAll.length > 0 ? (
            <button className="th-approve-all" onClick={() => approve(pendingAll.map((e) => e.id))}>
              Approve all · {pendingAll.length} {pendingAll.length === 1 ? 'entry' : 'entries'} ({hoursLabel(sum(pendingAll))})
            </button>
          ) : (
            entries.length > 0 && <div className="th-all-clear">Everything in this period is approved</div>
          )}
        </section>

        <div className="th-chips">
          {(['all', 'work', 'travel'] as TypeFilter[]).map((t) => (
            <button key={t} className={`th-chip ${typeFilter === t ? 'on' : ''}`} onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'All' : t === 'work' ? 'Labour' : 'Travel'}
            </button>
          ))}
          <button className={`th-chip ${pendingOnly ? 'on amber' : ''}`} onClick={() => setPendingOnly((v) => !v)}>
            To approve
          </button>
        </div>

        <div className="th-listhead">
          <span>{people.length} {people.length === 1 ? 'person' : 'people'}</span>
          <label className="th-sort">
            <select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <ChevronDownIcon size={16} />
          </label>
        </div>

        {people.length === 0 ? (
          <div className="th-empty">{pendingOnly ? 'Nothing waiting for approval in this period.' : 'No staff to show.'}</div>
        ) : (
          <ul className="th-list">
            {people.map(({ emp, es, labour, travel, total, pendHrs, pendIds, gross }) => {
              const isOpen = open === emp.id
              return (
                <li key={emp.id} className={`th-person ${total === 0 ? 'zero' : ''} ${isOpen ? 'open' : ''}`}>
                  <button className="th-person-row" onClick={() => setOpen(isOpen ? null : emp.id)} aria-expanded={isOpen}>
                    <span className="th-avatar" style={{ background: emp.color }}>{initials(emp.name)}</span>
                    <div className="th-person-main">
                      <div className="th-person-line">
                        <strong>{emp.name}</strong>
                        <span className="th-person-hours">{total > 0 ? hoursLabel(total) : '—'}</span>
                      </div>
                      <div className="th-bar">
                        <i className="lab" style={{ width: `${(labour / maxTotal) * 100}%` }} />
                        <i className="tra" style={{ width: `${(travel / maxTotal) * 100}%` }} />
                      </div>
                      <div className="th-person-sub">
                        <span>{total > 0 ? `${es.length} ${es.length === 1 ? 'entry' : 'entries'}` : 'No hours logged'}</span>
                        {pendIds.length > 0 && <span className="th-pend">{hoursLabel(pendHrs)} to approve</span>}
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="th-detail">
                      <div className="th-detail-head">
                        <span>{roleNameOf(state, emp.roleId)}</span>
                        <span>Labour {hoursLabel(labour)} · Travel {hoursLabel(travel)} · {eur(gross)} gross</span>
                      </div>
                      {es.length === 0 && <div className="th-empty small">Nothing logged in this period.</div>}
                      {es.map((t) => {
                        const job = state.jobs.find((j) => j.id === t.jobId)
                        return (
                          <div key={t.id} className="th-entry">
                            <div className="th-entry-body">
                              <strong>
                                {fmtDayShort(t.date)}
                                {t.kind === 'travel' && <span className="ts-travel-tag">Travel</span>}
                              </strong>
                              <span>{job ? job.title : t.note || 'Time entry'}</span>
                              {t.kind === 'travel' && (t.km || t.reason) && (
                                <span className="ts-entry-trip">
                                  {[t.km ? `${t.km} km` : '', t.reason, t.toPlace ? `to ${t.toPlace}` : ''].filter(Boolean).join(' · ')}
                                </span>
                              )}
                            </div>
                            <div className="th-entry-side">
                              <div className="ts-entry-time">
                                {timeRange(t) && <b>{timeRange(t)}</b>}
                                <span className={timeRange(t) ? '' : 'solo'}>{timeRange(t) ? '= ' : ''}{hrsText(t.hours)}</span>
                              </div>
                              {t.approved ? (
                                <span className="ts-entry-lock">Approved</span>
                              ) : (
                                <button className="th-approve" onClick={() => approve([t.id])}>Approve</button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      {pendIds.length > 1 && (
                        <button className="th-approve-person" onClick={() => approve(pendIds)}>
                          Approve all of {emp.name.split(' ')[0]}'s hours ({hoursLabel(pendHrs)})
                        </button>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
