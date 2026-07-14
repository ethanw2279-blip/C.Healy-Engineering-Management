import { useState } from 'react'
import { Modal, Field, Button } from './components/ui'
import { useStore, newId } from '../data/store'
import type { Product } from '../data/types'

export default function ProductModal({ editing, onClose }: { editing?: Product | null; onClose: () => void }) {
  const { dispatch } = useStore()
  const [name, setName] = useState(editing?.name ?? '')
  const [sku, setSku] = useState(editing?.sku ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [price, setPrice] = useState(editing?.price ?? 0)
  const [stock, setStock] = useState(editing?.stock ?? 0)
  const [active, setActive] = useState(editing?.active ?? true)

  const valid = name.trim().length > 0

  const save = () => {
    if (!valid) return
    if (editing) {
      dispatch({ type: 'UPDATE_PRODUCT', product: { ...editing, name, sku, description, price, stock, active } })
    } else {
      dispatch({
        type: 'ADD_PRODUCT',
        product: { id: newId('p'), name, sku, description, price, stock, active, createdAt: new Date().toISOString() },
      })
    }
    onClose()
  }

  return (
    <Modal
      title={editing ? `Edit ${editing.name}` : 'New product'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!valid}>{editing ? 'Save changes' : 'Add product'}</Button>
        </>
      }
    >
      <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Steel Lifting Hook — 2t" /></Field>
      <div className="field-row">
        <Field label="SKU / code"><input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="HK-2T" /></Field>
        <Field label="Price (€)"><input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} /></Field>
        <Field label="Stock on hand"><input type="number" min={0} step="1" value={stock} onChange={(e) => setStock(Number(e.target.value))} /></Field>
      </div>
      <Field label="Description"><textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details shown on the shop." /></Field>
      <label className="assign-chip" style={{ cursor: 'pointer' }}>
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} style={{ marginRight: 8 }} />
        Active (available to sell on the website)
      </label>
    </Modal>
  )
}
