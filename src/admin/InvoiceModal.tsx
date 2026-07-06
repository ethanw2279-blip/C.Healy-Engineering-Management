import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Field, Button } from './components/ui'
import { ClientSelect, LineItems, nextNumber, today, blankItems } from './formParts'
import { useStore, newId } from '../data/store'
import type { Invoice, InvoiceStatus, LineItem } from '../data/types'

const STATUSES: InvoiceStatus[] = ['Draft', 'Awaiting payment', 'Past due', 'Paid']

export default function InvoiceModal({
  editing,
  onClose,
}: {
  editing?: Invoice | null
  onClose: () => void
}) {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const [clientId, setClientId] = useState(editing?.clientId ?? '')
  const [due, setDue] = useState(editing?.dueOn ?? '')
  const [status, setStatus] = useState<InvoiceStatus>(editing?.status ?? 'Draft')
  const [items, setItems] = useState<LineItem[]>(editing?.items.length ? editing.items : blankItems())

  const save = () => {
    if (!clientId) return
    if (editing) {
      dispatch({
        type: 'UPDATE_INVOICE',
        invoice: { ...editing, clientId, dueOn: due || editing.dueOn, status, items: items.filter((i) => i.name.trim()) },
      })
    } else {
      const invoice: Invoice = {
        id: newId('i'),
        number: nextNumber('INV-', state.invoices.map((i) => i.number)),
        clientId,
        items: items.filter((i) => i.name.trim()),
        status: 'Draft',
        issuedOn: today(),
        dueOn: due || today(),
      }
      dispatch({ type: 'ADD_INVOICE', invoice })
      nav(`/invoices/${invoice.id}`)
    }
    onClose()
  }

  return (
    <Modal
      title={editing ? `Edit ${editing.number}` : 'New invoice'}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!clientId}>{editing ? 'Save changes' : 'Save invoice'}</Button>
        </>
      }
    >
      <div className="field-row">
        <ClientSelect value={clientId} onChange={setClientId} />
        <Field label="Due date"><input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
        {editing && (
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        )}
      </div>
      <LineItems items={items} setItems={setItems} />
    </Modal>
  )
}
