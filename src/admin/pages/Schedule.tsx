import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, Button, Avatar, EmptyState } from '../components/ui'
import { ChevronRightIcon } from '../../components/Icons'
import { useStore, useCurrentUser } from '../../data/store'
import { useCreate } from '../useCreate'
import type { Visit } from '../../data/types'
import {
  ymd, parseYmd, addDays, addMonths, isSameDay, weekDays, monthMatrix,
  MONTHS, DOW, fmtLong,
} from './calendarUtils'

type View = 'day' | 'week' | 'month'
const TODAY = parseYmd('2026-07-06')

export default function Schedule() {
  const { state, dispatch } = useStore()
  const { can } = useCurrentUser()
  const create = useCreate()
  const nav = useNavigate()
  const [view, setView] = useState<View>('week')
  const [cursor, setCursor] = useState<Date>(TODAY)

  // Drag a visit onto another day to reschedule it.
  const moveVisit = (visitId: string, dateStr: string) => {
    if (!can('create:records')) return
    const v = state.visits.find((x) => x.id === visitId)
    if (v && v.date !== dateStr) dispatch({ type: 'UPDATE_VISIT', visit: { ...v, date: dateStr } })
  }

  const jobById = (id: string) => state.jobs.find((j) => j.id === id)
  const empById = (id: string) => state.employees.find((e) => e.id === id)
  const clientName = (jobId: string) => {
    const job = jobById(jobId)
    return state.clients.find((c) => c.id === job?.clientId)?.name ?? ''
  }
  const eventsOn = (d: Date) =>
    state.visits
      .filter((v) => v.date === ymd(d))
      .sort((a, b) => a.start.localeCompare(b.start))

  const step = (dir: number) =>
    setCursor((c) =>
      view === 'day' ? addDays(c, dir) : view === 'week' ? addDays(c, dir * 7) : addMonths(c, dir),
    )

  const title = () => {
    if (view === 'day') return fmtLong(cursor)
    if (view === 'week') {
      const days = weekDays(cursor)
      const a = days[0]
      const b = days[6]
      const sameMonth = a.getMonth() === b.getMonth()
      return `${a.getDate()} ${sameMonth ? '' : MONTHS[a.getMonth()].slice(0, 3) + ' '}– ${b.getDate()} ${MONTHS[b.getMonth()].slice(0, 3)} ${b.getFullYear()}`
    }
    return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
  }

  const openDay = (d: Date) => { setCursor(d); setView('day') }

  return (
    <div>
      <PageHeader
        title="Schedule"
        subtitle="Everyone's visits"
        action={can('create:records') && <Button onClick={() => create('job')}>New job</Button>}
      />

      <div className="cal-toolbar">
        <div className="cal-nav">
          <button className="cal-arrow" onClick={() => step(-1)} aria-label="Previous"><ChevronRightIcon size={18} style={{ transform: 'rotate(180deg)' }} /></button>
          <button className="cal-today" onClick={() => setCursor(TODAY)}>Today</button>
          <button className="cal-arrow" onClick={() => step(1)} aria-label="Next"><ChevronRightIcon size={18} /></button>
          <span className="cal-title">{title()}</span>
        </div>
        <div className="cal-views">
          {(['day', 'week', 'month'] as View[]).map((v) => (
            <button key={v} className={`cal-view ${view === v ? 'on' : ''}`} onClick={() => setView(v)}>
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {view === 'day' && <DayView events={eventsOn(cursor)} jobById={jobById} empById={empById} clientName={clientName} nav={nav} />}
      {view === 'week' && (
        <WeekView cursor={cursor} eventsOn={eventsOn} empById={empById} jobById={jobById} nav={nav} openDay={openDay} onMove={moveVisit} />
      )}
      {view === 'month' && (
        <MonthView cursor={cursor} eventsOn={eventsOn} empById={empById} jobById={jobById} nav={nav} openDay={openDay} onMove={moveVisit} />
      )}
    </div>
  )
}

type Helpers = {
  jobById: (id: string) => { title: string } | undefined
  empById: (id: string) => { name: string; color: string } | undefined
}

// ---- Day view --------------------------------------------------------------
function DayView({
  events, jobById, empById, clientName, nav,
}: Helpers & {
  events: Visit[]
  clientName: (jobId: string) => string
  nav: (to: string) => void
}) {
  if (events.length === 0) return <div className="card"><EmptyState title="No visits this day" hint="Nothing scheduled." /></div>
  return (
    <div className="card">
      {events.map((v) => {
        const job = jobById(v.jobId)
        const emp = empById(v.employeeId)
        return (
          <button key={v.id} className="agenda-row" onClick={() => nav(`/jobs/${v.jobId}`)}>
            <div className="agenda-time"><strong>{v.start}</strong><span>{v.end}</span></div>
            <div className="agenda-bar" style={{ background: emp?.color ?? '#1F8A4C' }} />
            <div className="agenda-body">
              <strong>{job?.title ?? 'Visit'}</strong>
              <span>{clientName(v.jobId)}</span>
            </div>
            {emp && <div className="cell-with-avatar"><Avatar name={emp.name} color={emp.color} size={28} /><span className="cell-muted">{emp.name}</span></div>}
          </button>
        )
      })}
    </div>
  )
}

// ---- Week view -------------------------------------------------------------
function WeekView({
  cursor, eventsOn, empById, jobById, nav, openDay, onMove,
}: {
  cursor: Date
  eventsOn: (d: Date) => Visit[]
  empById: Helpers['empById']
  jobById: Helpers['jobById']
  nav: (to: string) => void
  openDay: (d: Date) => void
  onMove: (visitId: string, dateStr: string) => void
}) {
  const days = weekDays(cursor)
  return (
    <div className="week-grid">
      {days.map((d) => {
        const evs = eventsOn(d)
        const today = isSameDay(d, TODAY)
        return (
          <div
            key={ymd(d)}
            className={`week-col ${today ? 'today' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onMove(e.dataTransfer.getData('text/plain'), ymd(d)) }}
          >
            <button className="week-colhead" onClick={() => openDay(d)}>
              <span className="week-dow">{DOW[(d.getDay() + 6) % 7]}</span>
              <span className={`week-date ${today ? 'on' : ''}`}>{d.getDate()}</span>
            </button>
            <div className="week-events">
              {evs.length === 0 && <span className="week-empty">—</span>}
              {evs.map((v) => {
                const emp = empById(v.employeeId)
                return (
                  <button
                    key={v.id}
                    className="ev-chip"
                    style={{ borderLeftColor: emp?.color }}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', v.id)}
                    onClick={() => nav(`/jobs/${v.jobId}`)}
                  >
                    <span className="ev-time">{v.start}</span>
                    <span className="ev-title">{jobById(v.jobId)?.title ?? 'Visit'}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---- Month view ------------------------------------------------------------
function MonthView({
  cursor, eventsOn, empById, jobById, nav, openDay, onMove,
}: {
  cursor: Date
  eventsOn: (d: Date) => Visit[]
  empById: Helpers['empById']
  jobById: Helpers['jobById']
  nav: (to: string) => void
  openDay: (d: Date) => void
  onMove: (visitId: string, dateStr: string) => void
}) {
  const weeks = monthMatrix(cursor)
  const month = cursor.getMonth()
  return (
    <div className="month">
      <div className="month-dow">
        {DOW.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="month-grid">
        {weeks.flat().map((d) => {
          const evs = eventsOn(d)
          const outside = d.getMonth() !== month
          const today = isSameDay(d, TODAY)
          return (
            <div
              key={ymd(d)}
              className={`month-cell ${outside ? 'outside' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onMove(e.dataTransfer.getData('text/plain'), ymd(d)) }}
            >
              <button className={`month-daynum ${today ? 'on' : ''}`} onClick={() => openDay(d)}>{d.getDate()}</button>
              <div className="month-events">
                {evs.slice(0, 3).map((v) => {
                  const emp = empById(v.employeeId)
                  return (
                    <button
                      key={v.id}
                      className="ev-chip sm"
                      style={{ borderLeftColor: emp?.color }}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', v.id)}
                      onClick={() => nav(`/jobs/${v.jobId}`)}
                    >
                      <span className="ev-time">{v.start}</span>
                      <span className="ev-title">{jobById(v.jobId)?.title ?? 'Visit'}</span>
                    </button>
                  )
                })}
                {evs.length > 3 && <button className="month-more" onClick={() => openDay(d)}>+{evs.length - 3} more</button>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
