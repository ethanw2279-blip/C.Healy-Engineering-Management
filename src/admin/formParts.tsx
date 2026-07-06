import { Field } from './components/ui'
import { PlusIcon, TrashIcon } from '../components/Icons'
import { useStore, newId, eurExact, itemsTotal } from '../data/store'
import type { LineItem } from '../data/types'

// Shared building blocks for the create/edit modals.

export const today = () => new Date().toISOString().slice(0, 10)

export const blankItems = (): LineItem[] => [{ id: newId('li'), name: '', qty: 1, unitPrice: 0 }]

export function nextNumber(prefix: string, existing: string[]) {
  const nums = existing
    .map((n) => parseInt(n.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 1000) + 1
  return `${prefix}${next}`
}

export function ClientSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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

export function LineItems({
  items,
  setItems,
}: {
  items: LineItem[]
  setItems: (i: LineItem[]) => void
}) {
  const update = (id: string, patch: Partial<LineItem>) =>
    setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const add = () => setItems([...items, { id: newId('li'), name: '', qty: 1, unitPrice: 0 }])
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
          <input placeholder="Description" value={it.name} onChange={(e) => update(it.id, { name: e.target.value })} />
          <input className="li-qty" type="number" min={0} value={it.qty} onChange={(e) => update(it.id, { qty: Number(e.target.value) })} />
          <input className="li-price" type="number" min={0} value={it.unitPrice} onChange={(e) => update(it.id, { unitPrice: Number(e.target.value) })} />
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
