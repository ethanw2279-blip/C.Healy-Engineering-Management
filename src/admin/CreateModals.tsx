import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Field, Button } from './components/ui'
import { useStore, newId } from '../data/store'
import type { LineItem } from '../data/types'
import ClientModal from './ClientModal'
import JobModal from './JobModal'
import { ClientSelect, LineItems, nextNumber, today, blankItems } from './formParts'

export type CreateKind = 'client' | 'request' | 'quote' | 'job' | 'invoice'

// ---- Individual forms ------------------------------------------------------
function RequestForm({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const [clientId, setClientId] = useState('')
  const [title, setTitle] = useState('')
  const [service, setService] = useState('')

  const save = () => {
    if (!clientId || !title.trim()) return
    dispatch({
      type: 'ADD_REQUEST',
      request: { id: newId('r'), clientId, title, service, requestedOn: today(), status: 'New' },
    })
    onClose()
    nav('/requests')
  }

  return (
    <Modal
      title="New request"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!clientId || !title.trim()}>Save request</Button>
        </>
      }
    >
      <ClientSelect value={clientId} onChange={setClientId} />
      <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ceramic coating enquiry" /></Field>
      <Field label="Service"><input value={service} onChange={(e) => setService(e.target.value)} placeholder="e.g. Ceramic coating" /></Field>
      {state.clients.length === 0 && <p className="form-hint">Add a client first to raise a request.</p>}
    </Modal>
  )
}

function QuoteForm({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const [clientId, setClientId] = useState('')
  const [title, setTitle] = useState('')
  const [items, setItems] = useState<LineItem[]>(blankItems())

  const save = () => {
    if (!clientId || !title.trim()) return
    dispatch({
      type: 'ADD_QUOTE',
      quote: {
        id: newId('q'),
        number: nextNumber('Q-', state.quotes.map((q) => q.number)),
        clientId,
        title,
        items: items.filter((i) => i.name.trim()),
        status: 'Draft',
        createdAt: today(),
      },
    })
    onClose()
    nav('/quotes')
  }

  return (
    <Modal
      title="New quote"
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!clientId || !title.trim()}>Save quote</Button>
        </>
      }
    >
      <div className="field-row">
        <ClientSelect value={clientId} onChange={setClientId} />
        <Field label="Quote title"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Full exterior detail" /></Field>
      </div>
      <LineItems items={items} setItems={setItems} />
    </Modal>
  )
}

function InvoiceForm({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const [clientId, setClientId] = useState('')
  const [due, setDue] = useState('')
  const [items, setItems] = useState<LineItem[]>(blankItems())

  const save = () => {
    if (!clientId) return
    dispatch({
      type: 'ADD_INVOICE',
      invoice: {
        id: newId('i'),
        number: nextNumber('INV-', state.invoices.map((i) => i.number)),
        clientId,
        items: items.filter((i) => i.name.trim()),
        status: 'Draft',
        issuedOn: today(),
        dueOn: due || today(),
      },
    })
    onClose()
    nav('/invoices')
  }

  return (
    <Modal
      title="New invoice"
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!clientId}>Save invoice</Button>
        </>
      }
    >
      <div className="field-row">
        <ClientSelect value={clientId} onChange={setClientId} />
        <Field label="Due date"><input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
      </div>
      <LineItems items={items} setItems={setItems} />
    </Modal>
  )
}

export default function CreateModals({ kind, onClose }: { kind: CreateKind; onClose: () => void }) {
  switch (kind) {
    case 'client': return <ClientModal onClose={onClose} />
    case 'request': return <RequestForm onClose={onClose} />
    case 'quote': return <QuoteForm onClose={onClose} />
    case 'job': return <JobModal onClose={onClose} />
    case 'invoice': return <InvoiceForm onClose={onClose} />
  }
}
