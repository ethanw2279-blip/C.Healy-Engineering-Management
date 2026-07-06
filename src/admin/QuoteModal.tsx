import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Field, Button } from './components/ui'
import { ClientSelect, LineItems, nextNumber, today, blankItems } from './formParts'
import { useStore, newId } from '../data/store'
import type { Quote, QuoteStatus, LineItem } from '../data/types'

const STATUSES: QuoteStatus[] = ['Draft', 'Awaiting response', 'Approved', 'Converted', 'Archived']

export default function QuoteModal({
  editing,
  onClose,
}: {
  editing?: Quote | null
  onClose: () => void
}) {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const [clientId, setClientId] = useState(editing?.clientId ?? '')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [status, setStatus] = useState<QuoteStatus>(editing?.status ?? 'Draft')
  const [items, setItems] = useState<LineItem[]>(editing?.items.length ? editing.items : blankItems())

  const save = () => {
    if (!clientId || !title.trim()) return
    if (editing) {
      dispatch({
        type: 'UPDATE_QUOTE',
        quote: { ...editing, clientId, title, status, items: items.filter((i) => i.name.trim()) },
      })
    } else {
      const quote: Quote = {
        id: newId('q'),
        number: nextNumber('Q-', state.quotes.map((q) => q.number)),
        clientId,
        title,
        items: items.filter((i) => i.name.trim()),
        status: 'Draft',
        createdAt: today(),
      }
      dispatch({ type: 'ADD_QUOTE', quote })
      nav(`/quotes/${quote.id}`)
    }
    onClose()
  }

  return (
    <Modal
      title={editing ? `Edit ${editing.number}` : 'New quote'}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!clientId || !title.trim()}>{editing ? 'Save changes' : 'Save quote'}</Button>
        </>
      }
    >
      <div className="field-row">
        <ClientSelect value={clientId} onChange={setClientId} />
        <Field label="Quote title"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Full exterior detail" /></Field>
        {editing && (
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as QuoteStatus)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        )}
      </div>
      <LineItems items={items} setItems={setItems} />
    </Modal>
  )
}
