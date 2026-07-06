import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Field, Button } from './components/ui'
import { useStore, newId } from '../data/store'
import type { Client } from '../data/types'

const today = () => new Date().toISOString().slice(0, 10)

// Add or edit a client. Pass `editing` to edit; omit for a new client.
export default function ClientModal({
  editing,
  onClose,
}: {
  editing?: Client | null
  onClose: () => void
}) {
  const { dispatch } = useStore()
  const nav = useNavigate()
  const [f, setF] = useState<Client>(
    editing ?? {
      id: newId('c'),
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      status: 'Lead',
      createdAt: today(),
    },
  )
  const set = (patch: Partial<Client>) => setF({ ...f, ...patch })

  const save = () => {
    if (!f.name.trim()) return
    const client = { ...f, company: f.company?.trim() || undefined }
    if (editing) {
      dispatch({ type: 'UPDATE_CLIENT', client })
    } else {
      dispatch({ type: 'ADD_CLIENT', client })
      nav(`/clients/${client.id}`)
    }
    onClose()
  }

  return (
    <Modal
      title={editing ? 'Edit client' : 'New client'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>{editing ? 'Save changes' : 'Save client'}</Button>
        </>
      }
    >
      <Field label="Name"><input value={f.name} onChange={(e) => set({ name: e.target.value })} autoFocus /></Field>
      <Field label="Company (optional)"><input value={f.company ?? ''} onChange={(e) => set({ company: e.target.value })} /></Field>
      <div className="field-row">
        <Field label="Email"><input value={f.email} onChange={(e) => set({ email: e.target.value })} /></Field>
        <Field label="Phone"><input value={f.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
      </div>
      <Field label="Address"><input value={f.address} onChange={(e) => set({ address: e.target.value })} /></Field>
      <Field label="Status">
        <select value={f.status} onChange={(e) => set({ status: e.target.value as Client['status'] })}>
          <option>Lead</option>
          <option>Active</option>
          <option>Archived</option>
        </select>
      </Field>
    </Modal>
  )
}
