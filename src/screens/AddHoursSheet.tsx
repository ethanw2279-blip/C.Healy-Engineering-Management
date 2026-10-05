import { useState } from 'react'
import { useStore, useCurrentUser, newId } from '../data/store'
import { todayISO } from '../mobile/fieldHelpers'
import { useTrip } from '../mobile/useTrip'
import type { TimeEntry, TimeEntryKind } from '../data/types'
import './field.css'
import './Timesheet.css'

// Hours between two "HH:MM" times (0 if finish isn't after start).
function hoursBetween(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  return mins > 0 ? Math.round((mins / 60) * 100) / 100 : 0
}

const pad = (n: number) => String(n).padStart(2, '0')
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
const localISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// Quick picks for why the trip was made; anything else can be typed.
export const TRIP_REASONS = ['Job site', 'Collect materials', 'Supplier', 'Quote / survey', 'Office / yard']

// Manual time entry for the field app — for when someone forgets to clock in/out.
// Pass `editing` to change or delete an existing (unapproved) entry, or `kind`
// to preset Working vs Travel hours (e.g. the "Travel" quick action).
// Travel entries are trips: they also record km, the reason and where from/to,
// and can be started now and finished later with the Start trip button.
export default function AddHoursSheet({
  editing,
  kind: initialKind,
  onClose,
}: {
  editing?: TimeEntry
  kind?: TimeEntryKind
  onClose: () => void
}) {
  const { state, dispatch } = useStore()
  const { user } = useCurrentUser()
  const { trip, startTrip, endTrip } = useTrip()

  // Finishing a trip that was started earlier: prefill from it.
  const finishing = !editing && initialKind === 'travel' ? trip : null
  const now = new Date()
  const tripStart = finishing ? new Date(finishing.startedAt) : null

  const [kind, setKind] = useState<TimeEntryKind>(editing?.kind ?? (finishing ? 'travel' : initialKind ?? 'work'))
  const [date, setDate] = useState(editing?.date ?? (tripStart ? localISO(tripStart) : todayISO()))
  const [start, setStart] = useState(
    editing?.startTime ?? (tripStart ? hhmm(tripStart) : initialKind === 'travel' ? hhmm(new Date(now.getTime() - 30 * 60000)) : '08:00'),
  )
  const [end, setEnd] = useState(editing?.endTime ?? (tripStart || initialKind === 'travel' ? hhmm(now) : '16:00'))
  const [hoursInput, setHoursInput] = useState(editing?.hours ?? 0)
  const [jobId, setJobId] = useState(editing?.jobId ?? finishing?.jobId ?? '')
  const [note, setNote] = useState(editing?.note && editing.note !== 'Manual entry' && editing.note !== editing.reason ? editing.note : '')

  const [reason, setReason] = useState(editing?.reason ?? finishing?.reason ?? '')
  const [fromPlace, setFromPlace] = useState(editing?.fromPlace ?? finishing?.fromPlace ?? '')
  const [toPlace, setToPlace] = useState(editing?.toPlace ?? finishing?.toPlace ?? '')
  const [kmInput, setKmInput] = useState(editing?.km != null ? String(editing.km) : '')

  const isTrip = kind === 'travel'
  const jobs = state.jobs.filter((j) => j.status !== 'Complete' || j.id === editing?.jobId)
  // Old entries without times are edited as plain hours.
  const useTimes = !editing || (isTrip && !!editing.startTime && !!editing.endTime)
  const hours = useTimes ? hoursBetween(start, end) : hoursInput

  const km = Number(kmInput) || 0
  // New trips need a distance and a reason; older travel entries can be saved without.
  const tripOk = !isTrip || !!editing || (km > 0 && !!reason.trim())
  const valid = !!user && !!date && hours > 0 && tripOk

  // Picking a job fills "To" with the job's site address (or the client's) when it's still empty.
  const pickJob = (id: string) => {
    setJobId(id)
    if (!isTrip || toPlace.trim()) return
    const job = state.jobs.find((j) => j.id === id)
    const client = state.clients.find((c) => c.id === job?.clientId)
    const where = job?.siteAddress?.trim() || client?.address
    if (where) setToPlace(where)
  }

  const save = () => {
    if (!valid) return
    const base: Omit<TimeEntry, 'id'> = {
      employeeId: user!.id,
      jobId: jobId || undefined,
      date,
      hours,
      kind,
      note: note.trim() || (isTrip && reason.trim()) || 'Manual entry',
      approved: false,
      ...(isTrip
        ? {
            startTime: useTimes ? start : editing?.startTime,
            endTime: useTimes ? end : editing?.endTime,
            km: km > 0 ? km : undefined,
            reason: reason.trim() || undefined,
            fromPlace: fromPlace.trim() || undefined,
            toPlace: toPlace.trim() || undefined,
          }
        : { startTime: undefined, endTime: undefined, km: undefined, reason: undefined, fromPlace: undefined, toPlace: undefined }),
    }
    if (editing) {
      dispatch({ type: 'UPDATE_TIME_ENTRY', entry: { ...editing, ...base } })
    } else {
      dispatch({ type: 'ADD_TIME_ENTRY', entry: { id: newId('t'), ...base } })
      if (finishing) endTrip()
    }
    onClose()
  }

  const beginTrip = () => {
    startTrip({
      reason: reason.trim() || undefined,
      jobId: jobId || undefined,
      fromPlace: fromPlace.trim() || undefined,
      toPlace: toPlace.trim() || undefined,
    })
    onClose()
  }

  const cancelTrip = () => {
    if (confirm('Cancel this trip? Nothing will be saved.')) {
      endTrip()
      onClose()
    }
  }

  const remove = () => {
    if (editing && confirm('Delete this time entry?')) {
      dispatch({ type: 'REMOVE_TIME_ENTRY', id: editing.id })
      onClose()
    }
  }

  const title = editing
    ? isTrip ? 'Edit trip' : 'Edit hours'
    : finishing ? 'Finish trip' : isTrip ? 'Log a trip' : 'Add hours'

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">{title}</h2>

        {!finishing && (
          <div className="hours-kind" role="tablist" aria-label="Hours type">
            <button
              type="button"
              role="tab"
              aria-selected={kind === 'work'}
              className={`hours-kind-opt ${kind === 'work' ? 'is-work' : ''}`}
              onClick={() => setKind('work')}
            >
              Working hours
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={kind === 'travel'}
              className={`hours-kind-opt ${kind === 'travel' ? 'is-travel' : ''}`}
              onClick={() => setKind('travel')}
            >
              Travel / trip
            </button>
          </div>
        )}

        {finishing && tripStart && (
          <div className="trip-banner">
            <span>Trip started at <b>{hhmm(tripStart)}</b>. The finish time is set to now.</span>
            <button type="button" className="trip-banner-cancel" onClick={cancelTrip}>Cancel trip</button>
          </div>
        )}

        {isTrip && !editing && !finishing && (
          <div className="trip-start">
            <div>
              <strong>Leaving now?</strong>
              <span>Start the trip and finish it from Travel when you arrive. The times are recorded for you.</span>
            </div>
            <button type="button" className="trip-start-btn" onClick={beginTrip}>Start trip</button>
          </div>
        )}

        <div className="fld-form-field">
          <label>Date</label>
          <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </div>

        {useTimes ? (
          <>
            <div className="sheet-row">
              <div className="fld-form-field">
                <label>{isTrip ? 'Left at' : 'Start'}</label>
                <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div className="fld-form-field">
                <label>{isTrip ? 'Arrived at' : 'Finish'}</label>
                <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
            <div className={`sheet-hours ${hours > 0 ? '' : 'bad'}`}>
              {hours > 0 ? `${hours} hour${hours === 1 ? '' : 's'}` : 'Finish time must be after the start time'}
            </div>
          </>
        ) : (
          <div className="fld-form-field">
            <label>Hours</label>
            <input type="number" min={0} step="0.25" value={hoursInput} onChange={(e) => setHoursInput(Number(e.target.value))} />
          </div>
        )}

        {isTrip && (
          <>
            <div className="sheet-row">
              <div className="fld-form-field">
                <label>From</label>
                <input value={fromPlace} onChange={(e) => setFromPlace(e.target.value)} placeholder="e.g. Yard" />
              </div>
              <div className="fld-form-field">
                <label>To</label>
                <input value={toPlace} onChange={(e) => setToPlace(e.target.value)} placeholder="e.g. Site or supplier" />
              </div>
            </div>

            <div className="fld-form-field">
              <label>Distance (km)</label>
              <input type="number" inputMode="decimal" min={0} step="0.1" value={kmInput} onChange={(e) => setKmInput(e.target.value)} placeholder="km" />
            </div>

            <div className="fld-form-field">
              <label>Reason for the trip</label>
              <div className="chip-row trip-chips">
                {TRIP_REASONS.map((r) => (
                  <button key={r} type="button" className={`pick-chip ${reason === r ? 'on' : ''}`} onClick={() => setReason(reason === r ? '' : r)}>
                    {r}
                  </button>
                ))}
              </div>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Or type a reason" />
            </div>
          </>
        )}

        <div className="fld-form-field">
          <label>Job (optional)</label>
          <select value={jobId} onChange={(e) => pickJob(e.target.value)}>
            <option value="">No job</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.number} · {j.title}</option>
            ))}
          </select>
        </div>

        <div className="fld-form-field">
          <label>Note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={isTrip ? 'Anything else about the trip?' : 'What did you work on?'} />
        </div>

        {isTrip && !editing && !valid && hours > 0 && (
          <p className="trip-need">Add the km and a reason to save the trip.</p>
        )}
        <button className="fld-save" onClick={save} disabled={!valid}>
          {editing ? 'Save changes' : isTrip ? 'Save trip' : 'Save hours'}
        </button>
        {editing && <button className="sheet-delete" onClick={remove}>Delete entry</button>}
      </div>
    </div>
  )
}
