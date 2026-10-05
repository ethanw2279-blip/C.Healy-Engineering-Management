import { useMemo, useState } from 'react'
import { PageHeader, Button, Avatar, StatusBadge, EmptyState } from '../components/ui'
import { DownloadIcon } from '../../components/Icons'
import { useStore, useCurrentUser, formatDate } from '../../data/store'
import type { TimeEntry } from '../../data/types'
import { computeRange, csvCell, thisMonthStart, thisMonthEnd, type Period } from './Timesheets'
import './Timesheets.css'
import './Trips.css'

// Office view of trips: the travel entries crew log in the field app, with
// distance, reason and route, totalled per person and per reason.

const hrs = (h: number) => `${Math.round(h * 100) / 100}h`
const kmLabel = (k: number) => `${Math.round(k * 10) / 10} km`
const reasonOf = (t: TimeEntry) => t.reason?.trim() || 'No reason given'

export default function Trips() {
  const { state, dispatch } = useStore()
  const { can } = useCurrentUser()

  const [period, setPeriod] = useState<Period>('month')
  const [weekOff, setWeekOff] = useState(0)
  const [monthOff, setMonthOff] = useState(0)
  const [cFrom, setCFrom] = useState(thisMonthStart)
  const [cTo, setCTo] = useState(thisMonthEnd)
  const [empFilter, setEmpFilter] = useState('all')
  const [reasonFilter, setReasonFilter] = useState('all')

  const range = computeRange(period, weekOff, monthOff, cFrom, cTo)
  const empById = (id: string) => state.employees.find((e) => e.id === id)
  const jobById = (id?: string) => state.jobs.find((j) => j.id === id)

  // Every travel entry in the period (before the reason filter, so the
  // reason list doesn't shrink as you pick one).
  const inRange = useMemo(
    () =>
      state.timeEntries
        .filter((t) => t.kind === 'travel' && t.date >= range.from && t.date <= range.to)
        .filter((t) => empFilter === 'all' || t.employeeId === empFilter),
    [state.timeEntries, range.from, range.to, empFilter],
  )
  const reasons = Array.from(new Set(inRange.map(reasonOf))).sort()

  const trips = inRange
    .filter((t) => reasonFilter === 'all' || reasonOf(t) === reasonFilter)
    .sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : (b.startTime ?? '').localeCompare(a.startTime ?? '')))

  const totalKm = trips.reduce((s, t) => s + (t.km ?? 0), 0)
  const totalHours = trips.reduce((s, t) => s + t.hours, 0)
  const withKm = trips.filter((t) => t.km)
  const missingKm = trips.length - withKm.length
  const pending = trips.filter((t) => !t.approved)

  const perEmployee = state.employees
    .map((emp) => {
      const ts = trips.filter((t) => t.employeeId === emp.id)
      return { emp, count: ts.length, km: ts.reduce((s, t) => s + (t.km ?? 0), 0), hours: ts.reduce((s, t) => s + t.hours, 0) }
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.km - a.km)

  const perReason = reasons
    .map((r) => {
      const ts = trips.filter((t) => reasonOf(t) === r)
      return { reason: r, count: ts.length, km: ts.reduce((s, t) => s + (t.km ?? 0), 0) }
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.km - a.km || b.count - a.count)
  const maxReasonKm = Math.max(1, ...perReason.map((r) => r.km))

  const route = (t: TimeEntry) =>
    t.fromPlace || t.toPlace ? `${t.fromPlace || '?'} → ${t.toPlace || '?'}` : ''
  const times = (t: TimeEntry) => (t.startTime && t.endTime ? `${t.startTime}–${t.endTime}` : '')

  const exportCsv = () => {
    const head = ['Date', 'Employee', 'Left', 'Arrived', 'Hours', 'Km', 'From', 'To', 'Reason', 'Job', 'Note', 'Status']
    const rows = trips.map((t) => {
      const job = jobById(t.jobId)
      return [
        t.date, empById(t.employeeId)?.name ?? '', t.startTime ?? '', t.endTime ?? '',
        String(t.hours), t.km != null ? String(t.km) : '', t.fromPlace ?? '', t.toPlace ?? '',
        t.reason ?? '', job ? `${job.number} ${job.title}` : '',
        t.note && t.note !== t.reason ? t.note : '', t.approved ? 'Approved' : 'Pending',
      ]
    })
    const csv = [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `trips_${range.from}_${range.to}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  const stepDisabledNext = period === 'week' ? weekOff >= 0 : monthOff >= 0
  const step = (dir: 1 | -1) => (period === 'week' ? setWeekOff((o) => o + dir) : setMonthOff((o) => o + dir))
  const canApprove = can('approve:timesheets')
  const approve = (id: string) => dispatch({ type: 'APPROVE_TIME', id })

  return (
    <div>
      <PageHeader
        title="Trips"
        subtitle={`${range.label} · ${empFilter === 'all' ? 'all employees' : empById(empFilter)?.name ?? ''}`}
        action={
          <Button variant="secondary" onClick={exportCsv} disabled={trips.length === 0}>
            <DownloadIcon size={17} /> Export CSV
          </Button>
        }
      />

      <div className="ts-toolbar">
        <div className="ts-fld">
          <label>Period</label>
          <div className="ts-seg">
            {(['week', 'month', 'custom'] as Period[]).map((p) => (
              <button key={p} className={period === p ? 'on' : ''} onClick={() => setPeriod(p)}>
                {p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'Custom'}
              </button>
            ))}
          </div>
        </div>

        {period === 'custom' ? (
          <div className="ts-fld">
            <label>Date range</label>
            <div className="ts-daterow">
              <input className="ts-input" type="date" value={cFrom} max={cTo} onChange={(e) => setCFrom(e.target.value)} />
              <span className="ts-dash">–</span>
              <input className="ts-input" type="date" value={cTo} min={cFrom} onChange={(e) => setCTo(e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="ts-fld">
            <label>&nbsp;</label>
            <div className="ts-step">
              <button onClick={() => step(-1)} aria-label="Previous">‹</button>
              <div className="lbl"><strong>{range.label}</strong><span>{range.sub}</span></div>
              <button onClick={() => step(1)} disabled={stepDisabledNext} aria-label="Next">›</button>
            </div>
          </div>
        )}

        <div className="ts-fld">
          <label>Employee</label>
          <select className="ts-select" value={empFilter} onChange={(e) => setEmpFilter(e.target.value)}>
            <option value="all">All employees</option>
            {state.employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>

        <div className="ts-fld">
          <label>Reason</label>
          <select className="ts-select" value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)}>
            <option value="all">All reasons</option>
            {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <span className="ts-hint">{trips.length} trips · {kmLabel(totalKm)}</span>
      </div>

      <div className="stat-grid ts-stats">
        <div className="stat-card">
          <div className="stat-label"><span className="ts-dot b" /> Distance</div>
          <div className="stat-value">{kmLabel(totalKm)}</div>
          <div className="stat-meta">{withKm.length ? `${kmLabel(totalKm / withKm.length)} per trip` : 'No km logged'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><span className="ts-dot n" /> Trips</div>
          <div className="stat-value">{trips.length}</div>
          <div className="stat-meta">{missingKm > 0 ? <b>{missingKm} without km</b> : `${perEmployee.length} staff`}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><span className="ts-dot g" /> Time on the road</div>
          <div className="stat-value">{hrs(totalHours)}</div>
          <div className="stat-meta">{trips.length ? `${Math.round((totalHours / trips.length) * 60)} min per trip` : '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><span className="ts-dot a" /> Pending approval</div>
          <div className="stat-value">{pending.length}</div>
          <div className="stat-meta">{pending.length ? `${hrs(pending.reduce((s, t) => s + t.hours, 0))} of travel time` : 'All approved'}</div>
        </div>
      </div>

      {trips.length > 0 && (
        <div className="trips-split">
          <div className="card ts-card">
            <div className="panel-head"><h3>By employee</h3><span className="ts-panel-sub">{range.label}</span></div>
            <table className="table trips-mini">
              <thead><tr><th>Employee</th><th className="num">Trips</th><th className="num">Hours</th><th className="num">Km</th></tr></thead>
              <tbody>
                {perEmployee.map(({ emp, count, km, hours }) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="cell-with-avatar">
                        <Avatar name={emp.name} color={emp.color} size={26} />
                        <span className="cell-strong">{emp.name}</span>
                      </div>
                    </td>
                    <td className="num">{count}</td>
                    <td className="num">{hrs(hours)}</td>
                    <td className="num ts-travel-num">{kmLabel(km)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="ts-foot">
                  <td>Totals</td>
                  <td className="num">{trips.length}</td>
                  <td className="num">{hrs(totalHours)}</td>
                  <td className="num ts-travel-num">{kmLabel(totalKm)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="card ts-card">
            <div className="panel-head"><h3>By reason</h3><span className="ts-panel-sub">km</span></div>
            <ul className="trips-reasons">
              {perReason.map((r) => (
                <li key={r.reason}>
                  <div className="trips-reason-top">
                    <span className="cell-strong">{r.reason}</span>
                    <span className="cell-muted">{r.count} trip{r.count === 1 ? '' : 's'} · <b>{kmLabel(r.km)}</b></span>
                  </div>
                  <div className="trips-bar"><i style={{ width: `${(r.km / maxReasonKm) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="card ts-card">
        <div className="panel-head"><h3>Trips</h3><span className="ts-panel-sub">{trips.length} trips · newest first</span></div>
        {trips.length === 0 ? (
          <EmptyState title="No trips" hint="Crew log trips from Travel in the field app. Try a different period or filter." />
        ) : (
          <>
            <table className="table ts-desktop">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Route</th>
                  <th>Reason</th>
                  <th>Job</th>
                  <th className="num">Time</th>
                  <th className="num">Km</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => {
                  const emp = empById(t.employeeId)
                  const job = jobById(t.jobId)
                  return (
                    <tr key={t.id}>
                      <td className="cell-muted">{formatDate(t.date)}</td>
                      <td>
                        <div className="cell-with-avatar">
                          <Avatar name={emp?.name ?? '?'} color={emp?.color} size={26} />
                          {emp?.name}
                        </div>
                      </td>
                      <td>{route(t) || <span className="cell-muted">—</span>}</td>
                      <td>{t.reason || <span className="cell-muted">—</span>}</td>
                      <td className="cell-muted">{job ? job.number : '—'}</td>
                      <td className="num">
                        <div className="stack-tight trips-time">
                          <span className="cell-strong">{hrs(t.hours)}</span>
                          {times(t) && <span className="cell-muted">{times(t)}</span>}
                        </div>
                      </td>
                      <td className="num ts-travel-num">{t.km != null ? kmLabel(t.km) : <span className="cell-muted">—</span>}</td>
                      <td><StatusBadge status={t.approved ? 'Approved' : 'Pending'} /></td>
                      <td className="num">
                        {!t.approved && canApprove && (
                          <Button size="sm" variant="secondary" onClick={() => approve(t.id)}>Approve</Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="ts-entry-cards">
              {trips.map((t) => {
                const emp = empById(t.employeeId)
                const job = jobById(t.jobId)
                return (
                  <div key={t.id} className="ts-entry-card">
                    <div className="ts-entry-h">
                      <Avatar name={emp?.name ?? '?'} color={emp?.color} size={24} />
                      <span className="cell-strong">{emp?.name}</span>
                      <span className="ts-entry-date">{formatDate(t.date)}{times(t) ? ` · ${times(t)}` : ''}</span>
                    </div>
                    <div className="ts-entry-b">
                      <span className="badge badge-blue">{t.km != null ? kmLabel(t.km) : 'No km'}</span>
                      <span className="cell-muted">{[t.reason, route(t), job?.number].filter(Boolean).join(' · ') || '—'}</span>
                      <span className="ts-entry-hrs">{hrs(t.hours)}</span>
                    </div>
                    {t.approved
                      ? <div className="ts-entry-foot"><StatusBadge status="Approved" /></div>
                      : canApprove && <button className="ts-entry-approve" onClick={() => approve(t.id)}>✓ Approve · Pending</button>}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
