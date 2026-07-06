import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Field, Button, Avatar } from './components/ui'
import { PlusIcon, TrashIcon } from '../components/Icons'
import { useStore, newId, eurExact, itemsTotal } from '../data/store'
import type { LineItem } from '../data/types'
import ClientModal from './ClientModal'

export type CreateKind = 'client' | 'request' | 'quote' | 'job' | 'invoice'

// ---- Shared line-item editor ----------------------------------------------
function LineItems({
  items,
  setItems,
}: {
  items: LineItem[]
  setItems: (i: LineItem[]) => void
}) {
  const update = (id: string, patch: Partial<LineItem>) =>
    setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const add = () =>
    setItems([...items, { id: newId('li'), name: '', qty: 1, unitPrice: 0 }])
  const remove = (id: string) => setItems(items.filter((it) => it.id !== id))

  return (
    <div className="li-editor">
      <div className="li-head">
        <span>Product / service</span>
        <span className="li-qty">Qty</span>
        <span className="li-price">Unit €</span>
        <span className="li-total">Total</span>
        <span className="li-x" />
      </div>
      {items.map((it) => (
        <div key={it.id} className="li-row">
          <input
            placeholder="Description"
            value={it.name}
            onChange={(e) => update(it.id, { name: e.target.value })}
          />
          <input
            className="li-qty"
            type="number"
            min={0}
            value={it.qty}
            onChange={(e) => update(it.id, { qty: Number(e.target.value) })}
          />
          <input
            className="li-price"
            type="number"
            min={0}
            value={it.unitPrice}
            onChange={(e) => update(it.id, { unitPrice: Number(e.target.value) })}
          />
          <span className="li-total">{eurExact(it.qty * it.unitPrice)}</span>
          <button className="li-x" onClick={() => remove(it.id)} aria-label="Remove line">
            <TrashIcon size={18} />
          </button>
        </div>
      ))}
      <div className="li-foot">
        <button className="li-add" onClick={add}>
          <PlusIcon size={16} /> Add line item
        </button>
        <div className="li-grandtotal">
          <span>Total</span>
          <strong>{eurExact(itemsTotal(items))}</strong>
        </div>
      </div>
    </div>
  )
}

function ClientSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { state } = useStore()
  return (
    <Field label="Client">
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select a client…</option>
        {state.clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.company ? ` — ${c.company}` : ''}
          </option>
        ))}
      </select>
    </Field>
  )
}

function nextNumber(prefix: string, existing: string[]) {
  const nums = existing
    .map((n) => parseInt(n.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 1000) + 1
  return `${prefix}${next}`
}

const today = () => new Date().toISOString().slice(0, 10)

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
  const [items, setItems] = useState<LineItem[]>([{ id: newId('li'), name: '', qty: 1, unitPrice: 0 }])

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

function JobForm({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const [clientId, setClientId] = useState('')
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [assigned, setAssigned] = useState<string[]>([])
  const [items, setItems] = useState<LineItem[]>([{ id: newId('li'), name: '', qty: 1, unitPrice: 0 }])

  const toggle = (id: string) =>
    setAssigned((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))

  const save = () => {
    if (!clientId || !title.trim()) return
    const status = start ? 'Scheduled' : 'Unscheduled'
    dispatch({
      type: 'ADD_JOB',
      job: {
        id: newId('j'),
        number: nextNumber('J-', state.jobs.map((j) => j.number)),
        clientId,
        title,
        items: items.filter((i) => i.name.trim()),
        assignedTo: assigned,
        status,
        startDate: start,
        endDate: end || start,
      },
    })
    onClose()
    nav('/jobs')
  }

  return (
    <Modal
      title="New job"
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!clientId || !title.trim()}>Save job</Button>
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

function InvoiceForm({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const [clientId, setClientId] = useState('')
  const [due, setDue] = useState('')
  const [items, setItems] = useState<LineItem[]>([{ id: newId('li'), name: '', qty: 1, unitPrice: 0 }])

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
    case 'job': return <JobForm onClose={onClose} />
    case 'invoice': return <InvoiceForm onClose={onClose} />
  }
}
