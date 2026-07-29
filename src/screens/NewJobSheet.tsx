import { useState } from 'react'
import { useStore, useCurrentUser, newId } from '../data/store'
import type { Job } from '../data/types'
import './field.css'
import './Timesheet.css'

// Next "J-N" number one above the current maximum.
function nextJobNumber(existing: string[]) {
  let max = 1000
  for (const n of existing) {
    const m = /(\d+)\s*$/.exec(n)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `J-${max + 1}`
}

// Quick "new job" for the field app — assigned to you so it lands on your schedule.
export default function NewJobSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore()
  const { user } = useCurrentUser()
  const [clientId, setClientId] = useState('')
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('')

  const clients = [...state.clients].sort((a, b) => a.name.localeCompare(b.name))
  const valid = !!clientId && title.trim().length > 0

  const save = () => {
    if (!valid) return
    const job: Job = {
      id: newId('j'),
      number: nextJobNumber(state.jobs.map((j) => j.number)),
      clientId,
      title: title.trim(),
      items: [],
      assignedTo: user ? [user.id] : [],
      status: start ? 'Scheduled' : 'Unscheduled',
      startDate: start,
      endDate: start,
    }
    dispatch({ type: 'ADD_JOB', job })
    onClose()
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">New job</h2>
        <div className="fld-form-field">
          <label>Client</label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Select a client…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="fld-form-field"><label>Job title</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Gate repair" /></div>
        <div className="fld-form-field"><label>Start date (optional)</label><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <button className="fld-save" onClick={save} disabled={!valid}>Save job</button>
      </div>
    </div>
  )
}
