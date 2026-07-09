import { useEffect, useState } from 'react'
import { Modal, Field, Button, Avatar } from './components/ui'
import { useStore, newId } from '../data/store'
import type { Visit } from '../data/types'

// Add or edit a single scheduled visit (a job on a specific day + time, assigned
// to one crew member). Visits are what the Schedule calendar displays.
//
// Opened from a job page, `jobId` is fixed. Opened from the calendar, no job is
// set yet, so a job picker is shown.
export default function VisitModal({
  jobId: fixedJobId,
  editing,
  defaultDate,
  onClose,
}: {
  jobId?: string
  editing?: Visit | null
  defaultDate?: string
  onClose: () => void
}) {
  const { state, dispatch } = useStore()

  const [jobId, setJobId] = useState(editing?.jobId ?? fixedJobId ?? state.jobs[0]?.id ?? '')
  const job = state.jobs.find((j) => j.id === jobId)

  // Prefer the job's assigned crew; fall back to any active employee.
  const crew = job?.assignedTo
    .map((id) => state.employees.find((e) => e.id === id))
    .filter(Boolean) as { id: string; name: string; color: string }[]
  const options = crew?.length ? crew : state.employees.filter((e) => e.active)

  const [date, setDate] = useState(editing?.date ?? defaultDate ?? '')
  const [start, setStart] = useState(editing?.start ?? '09:00')
  const [end, setEnd] = useState(editing?.end ?? '17:00')
  const [employeeId, setEmployeeId] = useState(editing?.employeeId ?? options[0]?.id ?? '')

  // When the chosen job changes, prefill its start date and re-pick an assignee
  // if the current one isn't on the new job's crew.
  useEffect(() => {
    if (editing) return
    if (!date && job?.startDate) setDate(job.startDate)
    if (!options.find((o) => o.id === employeeId)) setEmployeeId(options[0]?.id ?? '')
  }, [jobId]) // eslint-disable-line react-hooks/exhaustive-deps

  const noJobs = state.jobs.length === 0
  const valid = !!jobId && !!date && !!employeeId && start < end

  const save = () => {
    if (!valid) return
    if (editing) {
      dispatch({ type: 'UPDATE_VISIT', visit: { ...editing, jobId, date, start, end, employeeId } })
    } else {
      dispatch({ type: 'ADD_VISIT', visit: { id: newId('v'), jobId, employeeId, date, start, end } })
    }
    onClose()
  }

  return (
    <Modal
      title={editing ? 'Edit visit' : 'Schedule a visit'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          {!noJobs && <Button onClick={save} disabled={!valid}>{editing ? 'Save visit' : 'Add visit'}</Button>}
        </>
      }
    >
      {noJobs ? (
        <p className="form-hint">Create a job first — visits are scheduled against a job.</p>
      ) : (
        <>
          {/* Job picker only when not already scoped to a job. */}
          {!fixedJobId && !editing && (
            <Field label="Job">
              <select value={jobId} onChange={(e) => setJobId(e.target.value)}>
                {state.jobs.map((j) => {
                  const c = state.clients.find((x) => x.id === j.clientId)
                  return <option key={j.id} value={j.id}>{j.number} · {j.title}{c ? ` — ${c.name}` : ''}</option>
                })}
              </select>
            </Field>
          )}

          <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <div className="field-row">
            <Field label="Start time"><input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
            <Field label="End time"><input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
          </div>
          {start >= end && <p className="form-hint">End time must be after the start time.</p>}

          <Field label="Assigned to">
            {options.length === 0 ? (
              <p className="form-hint">No active team members — add someone on the Team page first.</p>
            ) : (
              <div className="assign-row">
                {options.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    className={`assign-chip ${employeeId === e.id ? 'on' : ''}`}
                    onClick={() => setEmployeeId(e.id)}
                  >
                    <Avatar name={e.name} color={e.color} size={22} />
                    {e.name}
                  </button>
                ))}
              </div>
            )}
          </Field>
        </>
      )}
    </Modal>
  )
}
