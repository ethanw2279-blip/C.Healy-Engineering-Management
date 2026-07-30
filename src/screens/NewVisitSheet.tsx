import { useState } from 'react'
import { useStore, useCurrentUser, newId } from '../data/store'
import { todayISO } from '../mobile/fieldHelpers'
import type { Visit, VisitCategory } from '../data/types'
import './field.css'
import './Timesheet.css'

const CATEGORIES: VisitCategory[] = ['Job', 'Travel', 'Shop trip', 'Other']

// Add anything to your schedule — a job visit, travel time, a shop trip, etc.
export default function NewVisitSheet({ defaultDate, onClose }: { defaultDate?: string; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const { user } = useCurrentUser()

  const [category, setCategory] = useState<VisitCategory>('Job')
  const [date, setDate] = useState(defaultDate ?? todayISO())
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('10:00')
  const [jobId, setJobId] = useState('')
  const [title, setTitle] = useState('')

  const jobs = state.jobs.filter((j) => j.status !== 'Complete')
  const isJob = category === 'Job'
  const valid = !!user && !!date && start < end && (isJob ? !!jobId : title.trim().length > 0)

  const save = () => {
    if (!valid) return
    const visit: Visit = {
      id: newId('v'),
      employeeId: user!.id,
      date,
      start,
      end,
      category,
      jobId: isJob ? jobId : undefined,
      title: isJob ? undefined : title.trim(),
    }
    dispatch({ type: 'ADD_VISIT', visit })
    onClose()
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">Add to schedule</h2>

        <div className="fld-form-field">
          <label>Type</label>
          <div className="chip-row">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" className={`pick-chip ${category === c ? 'on' : ''}`} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>
        </div>

        {isJob ? (
          <div className="fld-form-field">
            <label>Job</label>
            <select value={jobId} onChange={(e) => setJobId(e.target.value)}>
              <option value="">Select a job…</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.number} · {j.title}</option>)}
            </select>
          </div>
        ) : (
          <div className="fld-form-field">
            <label>What is it?</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={category === 'Travel' ? 'e.g. Travel to Galway' : category === 'Shop trip' ? 'e.g. Collect steel' : 'Describe it'} />
          </div>
        )}

        <div className="fld-form-field">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="sheet-row">
          <div className="fld-form-field"><label>Start</label><input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div className="fld-form-field"><label>Finish</label><input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        </div>
        {start >= end && <div className="sheet-hours bad">Finish time must be after the start time</div>}

        <button className="fld-save" onClick={save} disabled={!valid}>Add to schedule</button>
      </div>
    </div>
  )
}
