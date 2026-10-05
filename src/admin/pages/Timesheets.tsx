import { useMemo, useState } from 'react'
import { PageHeader, Button, Avatar, StatusBadge, EmptyState } from '../components/ui'
import { CheckIcon, DownloadIcon } from '../../components/Icons'
import { useStore, useCurrentUser, eur, formatDate, roleNameOf } from '../../data/store'
import { weekDatesISO } from '../../mobile/fieldHelpers'
import type { TimeEntry, TimeEntryKind } from '../../data/types'
import './Timesheets.css'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type Period = 'week' | 'month' | 'custom'
type TypeFilter = 'all' | TimeEntryKind

const pad = (n: number) => String(n).padStart(2, '0')
const isoLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const fmtD = (iso: string) => (iso ? `${Number(iso.slice(8))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}` : '—')
const hrs = (h: number) => `${Math.round(h * 100) / 100}h`

const thisMonthStart = () => { const d = new Date(); return isoLocal(new Date(d.getFullYear(), d.getMonth(), 1)) }
const thisMonthEnd = () => { const d = new Date(); return isoLocal(new Date(d.getFullYear(), d.getMonth() + 1, 0)) }

type Range = { from: string; to: string; label: string; sub: string; steppable: boolean }

function computeRange(period: Period, weekOff: number, monthOff: number, cFrom: string, cTo: string): Range {
  if (period === 'week') {
    const base = new Date()
    base.setDate(base.getDate() + weekOff * 7)
    const wk = weekDatesISO(base)
    return {
      from: wk[0], to: wk[6],
      label: `${fmtD(wk[0])} – ${fmtD(wk[6])}`,
      sub: weekOff === 0 ? 'This week' : weekOff === -1 ? 'Last week' : `${wk[0].slice(0, 4)}`,
      steppable: true,
    }
  }
  if (period === 'month') {
    const b = new Date()
    b.setDate(1)
    b.setMonth(b.getMonth() + monthOff)
    return {
      from: isoLocal(new Date(b.getFullYear(), b.getMonth(), 1)),
      to: isoLocal(new Date(b.getFullYear(), b.getMonth() + 1, 0)),
      label: `${MONTHS[b.getMonth()]} ${b.getFullYear()}`,
      sub: monthOff === 0 ? 'This month' : monthOff === -1 ? 'Last month' : '',
      steppable: true,
    }
  }
  const from = cFrom <= cTo ? cFrom : cTo
  const to = cFrom <= cTo ? cTo : cFrom
  return { from, to, label: `${fmtD(from)} – ${fmtD(to)}`, sub: 'Custom range', steppable: false }
}

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)

export default function Timesheets() {
  const { state, dispatch } = useStore()
  const { can } = useCurrentUser()

  const [period, setPeriod] = useState<Period>('week')
  const [weekOff, setWeekOff] = useState(0)
  const [monthOff, setMonthOff] = useState(0)
  const [cFrom, setCFrom] = useState(thisMonthStart)
  const [cTo, setCTo] = useState(thisMonthEnd)
  const [empFilter, setEmpFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const empById = (id: string) => state.employees.find((e) => e.id === id)
  const rateFor = (e: TimeEntry) => {
    const emp = empById(e.employeeId)
    return e.kind === 'travel' ? emp?.travelRate ?? 0 : emp?.hourlyRate ?? 0
  }
  const grossOf = (e: TimeEntry) => e.hours * rateFor(e)

  const range = computeRange(period, weekOff, monthOff, cFrom, cTo)

  // Entries within the selected range, employee and type filters.
  const entries = useMemo(() => {
    return state.timeEntries
      .filter((t) => t.date >= range.from && t.date <= range.to)
      .filter((t) => empFilter === 'all' || t.employeeId === empFilter)
      .filter((t) => typeFilter === 'all' || t.kind === typeFilter)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  }, [state.timeEntries, range.from, range.to, empFilter, typeFilter])

  // Totals for the stat row.
  const labourHours = entries.filter((e) => e.kind === 'work').reduce((s, e) => s + e.hours, 0)
  const travelHours = entries.filter((e) => e.kind === 'travel').reduce((s, e) => s + e.hours, 0)
  const totalHours = labourHours + travelHours
  const grossTotal = entries.reduce((s, e) => s + grossOf(e), 0)
  const labourGross = entries.filter((e) => e.kind === 'work').reduce((s, e) => s + grossOf(e), 0)
  const travelGross = grossTotal - labourGross
  const pending = entries.filter((e) => !e.approved)
  const pendingHours = pending.reduce((s, e) => s + e.hours, 0)
  const pendingGross = pending.reduce((s, e) => s + grossOf(e), 0)

  // Per-employee rollup (stable order, only staff with hours in view).
  const perEmployee = state.employees
    .map((emp) => {
      const es = entries.filter((e) => e.employeeId === emp.id)
      const labour = es.filter((e) => e.kind === 'work').reduce((s, e) => s + e.hours, 0)
      const travel = es.filter((e) => e.kind === 'travel').reduce((s, e) => s + e.hours, 0)
      const gross = es.reduce((s, e) => s + grossOf(e), 0)
      const pendIds = es.filter((e) => !e.approved).map((e) => e.id)
      const pendHrs = es.filter((e) => !e.approved).reduce((s, e) => s + e.hours, 0)
      return { emp, labour, travel, total: labour + travel, gross, pendIds, pendHrs }
    })
    .filter((r) => r.total > 0)

  const approveIds = (ids: string[]) => ids.forEach((id) => dispatch({ type: 'APPROVE_TIME', id }))
  const approveAll = () => approveIds(pending.map((e) => e.id))

  const exportCsv = () => {
    const head = ['Date', 'Employee', 'Role', 'Type', 'Note', 'Hours', 'Rate (€/h)', 'Gross (€)', 'Status']
    const rows = entries.map((e) => {
      const emp = empById(e.employeeId)
      return [
        e.date, emp?.name ?? '', roleNameOf(state, emp?.roleId ?? ''),
        e.kind === 'travel' ? 'Travel' : 'Labour', e.note ?? '',
        String(e.hours), String(rateFor(e)), grossOf(e).toFixed(2),
        e.approved ? 'Approved' : 'Pending',
      ]
    })
    const csv = [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `timesheets_${range.from}_${range.to}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  const stepDisabledNext = period === 'week' ? weekOff >= 0 : monthOff >= 0
  const step = (dir: 1 | -1) => (period === 'week' ? setWeekOff((o) => o + dir) : setMonthOff((o) => o + dir))
  const canApprove = can('approve:timesheets')

  const splitBar = (labour: number, travel: number) => {
    const tot = labour + travel || 1
    return (
      <div className="ts-splitbar">
        <i className="lab" style={{ width: `${(labour / tot) * 100}%` }} />
        <i className="tra" style={{ width: `${(travel / tot) * 100}%` }} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Timesheets"
        subtitle={`${range.label} · ${empFilter === 'all' ? 'all employees' : empById(empFilter)?.name ?? ''}`}
        action={
          <div className="ts-head-actions">
            <Button variant="secondary" onClick={exportCsv} disabled={entries.length === 0}>
              <DownloadIcon size={17} /> Export CSV
            </Button>
            {canApprove && (
              <Button onClick={approveAll} disabled={pending.length === 0}>
                <CheckIcon size={18} /> Approve all{pending.length ? ` (${pending.length})` : ''}
              </Button>
            )}
          </div>
        }
      />

      {/* Filter toolbar */}
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
          <label>Type</label>
          <div className="ts-seg">
            <button className={typeFilter === 'all' ? 'on' : ''} onClick={() => setTypeFilter('all')}>All</button>
            <button className={typeFilter === 'work' ? 'on labour' : ''} onClick={() => setTypeFilter('work')}>Labour</button>
            <button className={typeFilter === 'travel' ? 'on travel' : ''} onClick={() => setTypeFilter('travel')}>Travel</button>
          </div>
        </div>

        <span className="ts-hint">{entries.length} entries · {hrs(totalHours)}</span>
      </div>

      {/* Stat cards */}
      <div className="stat-grid ts-stats">
        <div className="stat-card">
          <div className="stat-label"><span className="ts-dot g" /> Labour hours</div>
          <div className="stat-value">{hrs(labourHours)}</div>
          <div className="stat-meta">{perEmployee.length} staff</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><span className="ts-dot b" /> Travel hours</div>
          <div className="stat-value">{hrs(travelHours)}</div>
          <div className="stat-meta">{totalHours > 0 ? Math.round((travelHours / totalHours) * 100) : 0}% of total time</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><span className="ts-dot n" /> Total gross pay</div>
          <div className="stat-value">{eur(grossTotal)}</div>
          <div className="stat-meta">labour {eur(labourGross)} · travel {eur(travelGross)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><span className="ts-dot a" /> Pending approval</div>
          <div className="stat-value">{hrs(pendingHours)}</div>
          <div className="stat-meta"><b>{pending.length} entries</b> · {eur(pendingGross)}</div>
        </div>
      </div>

      {/* Hours by employee */}
      <div className="card ts-card">
        <div className="panel-head"><h3>Hours by employee</h3><span className="ts-panel-sub">{range.label}</span></div>
        {perEmployee.length === 0 ? (
          <EmptyState title="No hours logged" hint="Nothing recorded for this period and filter." />
        ) : (
          <>
            <table className="table ts-desktop">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th className="num">Labour €/h · Travel €/h</th>
                  <th className="num">Labour hrs</th>
                  <th className="num">Travel hrs</th>
                  <th className="num">Total hrs</th>
                  <th>Split</th>
                  <th className="num">Gross pay</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {perEmployee.map(({ emp, labour, travel, total, gross, pendIds, pendHrs }) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="cell-with-avatar">
                        <Avatar name={emp.name} color={emp.color} size={30} />
                        <div className="stack-tight">
                          <span className="cell-strong">{emp.name}</span>
                          <span className="cell-muted">{roleNameOf(state, emp.roleId)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="num cell-muted">{emp.hourlyRate ? eur(emp.hourlyRate) : '—'} · {emp.travelRate ? eur(emp.travelRate) : '—'}</td>
                    <td className="num cell-strong">{hrs(labour)}</td>
                    <td className="num ts-travel-num">{travel > 0 ? hrs(travel) : <span className="cell-muted">—</span>}</td>
                    <td className="num cell-strong">{hrs(total)}</td>
                    <td>{splitBar(labour, travel)}</td>
                    <td className="num cell-strong">{eur(gross)}</td>
                    <td className="num">
                      {pendIds.length > 0 ? (
                        canApprove ? (
                          <button className="ts-approve-wk" onClick={() => approveIds(pendIds)}>Approve week · {hrs(pendHrs)}</button>
                        ) : <span className="badge badge-amber">{hrs(pendHrs)}</span>
                      ) : <span className="cell-muted">All approved</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="ts-foot">
                  <td>Totals · {perEmployee.length} staff</td>
                  <td />
                  <td className="num">{hrs(labourHours)}</td>
                  <td className="num ts-travel-num">{hrs(travelHours)}</td>
                  <td className="num">{hrs(totalHours)}</td>
                  <td />
                  <td className="num">{eur(grossTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>

            {/* Mobile cards */}
            <div className="ts-emp-cards">
              {perEmployee.map(({ emp, labour, travel, total, gross, pendIds, pendHrs }) => (
                <div key={emp.id} className="ts-emp-card">
                  <div className="ts-emp-top">
                    <Avatar name={emp.name} color={emp.color} size={34} />
                    <div className="stack-tight">
                      <span className="cell-strong">{emp.name}</span>
                      <span className="cell-muted">{roleNameOf(state, emp.roleId)} · {emp.hourlyRate ? eur(emp.hourlyRate) : '—'} · {emp.travelRate ? eur(emp.travelRate) : '—'}/h</span>
                    </div>
                    <div className="ts-emp-pay"><strong>{eur(gross)}</strong><span>gross</span></div>
                  </div>
                  <div className="ts-metrics">
                    <div className="ts-metric lab"><b>{hrs(labour)}</b><small>Labour</small></div>
                    <div className="ts-metric tra"><b>{travel > 0 ? hrs(travel) : '—'}</b><small>Travel</small></div>
                    <div className="ts-metric tot"><b>{hrs(total)}</b><small>Total</small></div>
                  </div>
                  {pendIds.length > 0 ? (
                    canApprove
                      ? <button className="ts-approve-wk full" onClick={() => approveIds(pendIds)}>Approve week · {hrs(pendHrs)} pending</button>
                      : <div className="ts-allclear"><span className="badge badge-amber">{hrs(pendHrs)} pending</span></div>
                  ) : <div className="ts-allclear">All approved</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Time entries */}
      <div className="card ts-card">
        <div className="panel-head"><h3>Time entries</h3><span className="ts-panel-sub">{entries.length} entries · newest first</span></div>
        {entries.length === 0 ? (
          <EmptyState title="No entries" hint="Try a different week, employee or type." />
        ) : (
          <>
            <table className="table ts-desktop">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Note</th>
                  <th className="num">Hours</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const emp = empById(e.employeeId)
                  return (
                    <tr key={e.id}>
                      <td className="cell-muted">{formatDate(e.date)}</td>
                      <td>
                        <div className="cell-with-avatar">
                          <Avatar name={emp?.name ?? '?'} color={emp?.color} size={26} />
                          {emp?.name}
                        </div>
                      </td>
                      <td><span className={`badge ${e.kind === 'travel' ? 'badge-blue' : 'badge-green'}`}>{e.kind === 'travel' ? 'Travel' : 'Labour'}</span></td>
                      <td className="cell-muted">{e.note ?? '—'}</td>
                      <td className="num cell-strong">{hrs(e.hours)}</td>
                      <td><StatusBadge status={e.approved ? 'Approved' : 'Pending'} /></td>
                      <td className="num">
                        {!e.approved && canApprove && (
                          <Button size="sm" variant="secondary" onClick={() => dispatch({ type: 'APPROVE_TIME', id: e.id })}>Approve</Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="ts-entry-cards">
              {entries.map((e) => {
                const emp = empById(e.employeeId)
                return (
                  <div key={e.id} className="ts-entry-card">
                    <div className="ts-entry-h">
                      <Avatar name={emp?.name ?? '?'} color={emp?.color} size={24} />
                      <span className="cell-strong">{emp?.name}</span>
                      <span className="ts-entry-date">{formatDate(e.date)}</span>
                    </div>
                    <div className="ts-entry-b">
                      <span className={`badge ${e.kind === 'travel' ? 'badge-blue' : 'badge-green'}`}>{e.kind === 'travel' ? 'Travel' : 'Labour'}</span>
                      <span className="cell-muted">{e.note ?? '—'}</span>
                      <span className="ts-entry-hrs">{hrs(e.hours)}</span>
                    </div>
                    {e.approved
                      ? <div className="ts-entry-foot"><StatusBadge status="Approved" /></div>
                      : canApprove && <button className="ts-entry-approve" onClick={() => dispatch({ type: 'APPROVE_TIME', id: e.id })}>✓ Approve · Pending</button>}
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
