import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Field, Button, Avatar } from './components/ui'
import { ClientSelect, LineItems, nextNumber, blankItems } from './formParts'
import { useStore, newId } from '../data/store'
import type { Job, JobStatus, LineItem } from '../data/types'

const STATUSES: JobStatus[] = ['Unscheduled', 'Scheduled', 'Active', 'Requires invoicing', 'Complete']

export default function JobModal({
  editing,
  onClose,
}: {
  editing?: Job | null
  onClose: () => void
}) {
  const { state, dispatch } = useStore()
  const nav = useNavigate()

  const [clientId, setClientId] = useState(editing?.clientId ?? '')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [start, setStart] = useState(editing?.startDate ?? '')
  const [end, setEnd] = useState(editing?.endDate ?? '')
  const [assigned, setAssigned] = useState<string[]>(editing?.assignedTo ?? [])
  const [status, setStatus] = useState<JobStatus>(editing?.status ?? 'Unscheduled')
  const [items, setItems] = useState<LineItem[]>(editing?.items.length ? editing.items : blankItems())

  const toggle = (id: string) =>
    setAssigned((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))

  const save = () => {
    if (!clientId || !title.trim()) return
    if (editing) {
      dispatch({
        type: 'UPDATE_JOB',
        job: {
          ...editing,
          clientId,
          title,
          items: items.filter((i) => i.name.trim()),
          assignedTo: assigned,
          status,
          startDate: start,
          endDate: end || start,
        },
      })
    } else {
      const job: Job = {
        id: newId('j'),
        number: nextNumber('J-', state.jobs.map((j) => j.number)),
        clientId,
        title,
        items: items.filter((i) => i.name.trim()),
        assignedTo: assigned,
        status: start ? 'Scheduled' : 'Unscheduled',
        startDate: start,
        endDate: end || start,
      }
      dispatch({ type: 'ADD_JOB', job })
      nav(`/jobs/${job.id}`)
    }
    onClose()
  }

  return (
    <Modal
      title={editing ? `Edit ${editing.number}` : 'New job'}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!clientId || !title.trim()}>
            {editing ? 'Save changes' : 'Save job'}
          </Button>
        </>
      }
    >
      <div className="field-row">
        <ClientSelect value={clientId} onChange={setClientId} />
        <Field label="Job title"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Interior deep clean" /></Field>
      </div>
      <div className="field-row">
        <Field label="Start date"><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="End date"><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
        {editing && (
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as JobStatus)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        )}
      </div>
      <Field label="Assign team">
        <div className="assign-row">
          {state.employees.filter((e) => e.active).map((e) => (
            <button
              key={e.id}
              type="button"
              className={`assign-chip ${assigned.includes(e.id) ? 'on' : ''}`}
              onClick={() => toggle(e.id)}
            >
              <Avatar name={e.name} color={e.color} size={22} />
              {e.name}
            </button>
          ))}
        </div>
      </Field>
      <LineItems items={items} setItems={setItems} />
    </Modal>
  )
}
