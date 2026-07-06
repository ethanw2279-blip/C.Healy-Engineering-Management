import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Field, Button } from './components/ui'
import { ClientSelect, today } from './formParts'
import { useStore, newId } from '../data/store'
import type { Request, RequestStatus } from '../data/types'

const STATUSES: RequestStatus[] = ['New', 'Assessment complete', 'Converted', 'Archived']

export default function RequestModal({
  editing,
  onClose,
}: {
  editing?: Request | null
  onClose: () => void
}) {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const [clientId, setClientId] = useState(editing?.clientId ?? '')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [service, setService] = useState(editing?.service ?? '')
  const [status, setStatus] = useState<RequestStatus>(editing?.status ?? 'New')

  const save = () => {
    if (!clientId || !title.trim()) return
    if (editing) {
      dispatch({ type: 'UPDATE_REQUEST', request: { ...editing, clientId, title, service, status } })
    } else {
      const request: Request = { id: newId('r'), clientId, title, service, requestedOn: today(), status: 'New' }
      dispatch({ type: 'ADD_REQUEST', request })
      nav(`/requests/${request.id}`)
    }
    onClose()
  }

  return (
    <Modal
      title={editing ? 'Edit request' : 'New request'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!clientId || !title.trim()}>{editing ? 'Save changes' : 'Save request'}</Button>
        </>
      }
    >
      <ClientSelect value={clientId} onChange={setClientId} />
      <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ceramic coating enquiry" /></Field>
      <Field label="Service"><input value={service} onChange={(e) => setService(e.target.value)} placeholder="e.g. Ceramic coating" /></Field>
      {editing && (
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value as RequestStatus)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
      )}
      {state.clients.length === 0 && <p className="form-hint">Add a client first to raise a request.</p>}
    </Modal>
  )
}
