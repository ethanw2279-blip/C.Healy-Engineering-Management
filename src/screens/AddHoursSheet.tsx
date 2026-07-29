import { useState } from 'react'
import { useStore, useCurrentUser, newId } from '../data/store'
import { todayISO } from '../mobile/fieldHelpers'
import type { TimeEntry } from '../data/types'
import './field.css'
import './Timesheet.css'

// Hours between two "HH:MM" times (0 if finish isn't after start).
function hoursBetween(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  return mins > 0 ? Math.round((mins / 60) * 100) / 100 : 0
}

// Manual time entry for the field app — for when someone forgets to clock in/out.
// Pass `editing` to change or delete an existing (unapproved) entry.
export default function AddHoursSheet({ editing, onClose }: { editing?: TimeEntry; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const { user } = useCurrentUser()

  const [date, setDate] = useState(editing?.date ?? todayISO())
  const [start, setStart] = useState('08:00')
  const [end, setEnd] = useState('16:00')
  const [hoursInput, setHoursInput] = useState(editing?.hours ?? 0)
  const [jobId, setJobId] = useState(editing?.jobId ?? '')
  const [note, setNote] = useState(editing?.note && editing.note !== 'Manual entry' ? editing.note : '')

  const jobs = state.jobs.filter((j) => j.status !== 'Complete' || j.id === editing?.jobId)
  const hours = editing ? hoursInput : hoursBetween(start, end)
  const valid = !!user && !!date && hours > 0

  const save = () => {
    if (!valid) return
    const base = {
      employeeId: user!.id,
      jobId: jobId || undefined,
      date,
      hours,
      note: note.trim() || 'Manual entry',
      approved: false,
    }
    if (editing) {
      dispatch({ type: 'UPDATE_TIME_ENTRY', entry: { ...editing, ...base } })
    } else {
      dispatch({ type: 'ADD_TIME_ENTRY', entry: { id: newId('t'), ...base } })
    }
    onClose()
  }

  const remove = () => {
    if (editing && confirm('Delete this time entry?')) {
      dispatch({ type: 'REMOVE_TIME_ENTRY', id: editing.id })
      onClose()
    }
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">{editing ? 'Edit hours' : 'Add hours'}</h2>

        <div className="fld-form-field">
          <label>Date</label>
          <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </div>

        {editing ? (
          <div className="fld-form-field">
            <label>Hours</label>
            <input type="number" min={0} step="0.25" value={hoursInput} onChange={(e) => setHoursInput(Number(e.target.value))} />
          </div>
        ) : (
          <>
            <div className="sheet-row">
              <div className="fld-form-field">
                <label>Start</label>
                <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div className="fld-form-field">
                <label>Finish</label>
                <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
            <div className={`sheet-hours ${hours > 0 ? '' : 'bad'}`}>
              {hours > 0 ? `${hours} hour${hours === 1 ? '' : 's'}` : 'Finish time must be after the start time'}
            </div>
          </>
        )}

        <div className="fld-form-field">
          <label>Job (optional)</label>
          <select value={jobId} onChange={(e) => setJobId(e.target.value)}>
            <option value="">No job</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.number} · {j.title}</option>
            ))}
          </select>
        </div>

        <div className="fld-form-field">
          <label>Note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you work on?" />
        </div>

        <button className="fld-save" onClick={save} disabled={!valid}>{editing ? 'Save changes' : 'Save hours'}</button>
        {editing && <button className="sheet-delete" onClick={remove}>Delete entry</button>}
      </div>
    </div>
  )
}
