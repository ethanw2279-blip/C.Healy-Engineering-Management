import { useState } from 'react'
import { Modal, Field, Button } from './components/ui'
import { TrashIcon, PlusIcon } from '../components/Icons'
import { useStore, newId } from '../data/store'
import type { Product, ProductSpec } from '../data/types'

// Turn a name into a URL-safe slug for the website product page.
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')

export default function ProductModal({ editing, onClose }: { editing?: Product | null; onClose: () => void }) {
  const { dispatch } = useStore()
  const [name, setName] = useState(editing?.name ?? '')
  const [slug, setSlug] = useState(editing?.slug ?? '')
  const [sku, setSku] = useState(editing?.sku ?? '')
  const [category, setCategory] = useState(editing?.category ?? '')
  const [subcategory, setSubcategory] = useState(editing?.subcategory ?? '')
  const [tag, setTag] = useState(editing?.tag ?? '')
  const [short, setShort] = useState(editing?.short ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [price, setPrice] = useState(editing?.price ?? 0)
  const [stock, setStock] = useState(editing?.stock ?? 0)
  const [active, setActive] = useState(editing?.active ?? true)
  const [images, setImages] = useState((editing?.images ?? []).join('\n'))
  const [specs, setSpecs] = useState<ProductSpec[]>(editing?.specs ?? [])

  const valid = name.trim().length > 0

  const setSpec = (i: number, patch: Partial<ProductSpec>) =>
    setSpecs((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  const addSpec = () => setSpecs((s) => [...s, { label: '', value: '' }])
  const removeSpec = (i: number) => setSpecs((s) => s.filter((_, idx) => idx !== i))

  const save = () => {
    if (!valid) return
    const imageList = images.split('\n').map((s) => s.trim()).filter(Boolean)
    const cleanSpecs = specs.filter((s) => s.label.trim())
    const fields = {
      name, sku, description, price, stock, active,
      slug: slug.trim() || slugify(name),
      category: category.trim() || undefined,
      subcategory: subcategory.trim() || undefined,
      short: short.trim() || undefined,
      tag: tag.trim() || undefined,
      images: imageList,
      specs: cleanSpecs,
    }
    if (editing) {
      dispatch({ type: 'UPDATE_PRODUCT', product: { ...editing, ...fields } })
    } else {
      dispatch({ type: 'ADD_PRODUCT', product: { id: newId('p'), createdAt: new Date().toISOString(), ...fields } })
    }
    onClose()
  }

  return (
    <Modal
      title={editing ? `Edit ${editing.name}` : 'New product'}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!valid}>{editing ? 'Save changes' : 'Add product'}</Button>
        </>
      }
    >
      <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Strickland Spring Hitch 6t" /></Field>
      <div className="field-row">
        <Field label="Category"><input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Digger Hitches" /></Field>
        <Field label="Type (optional)"><input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder="Spring Hitches" /></Field>
        <Field label="Badge (optional)"><input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="New in" /></Field>
      </div>
      <div className="field-row">
        <Field label="Price (€)"><input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} /></Field>
        <Field label="Stock on hand"><input type="number" min={0} step="1" value={stock} onChange={(e) => setStock(Number(e.target.value))} /></Field>
        <Field label="SKU / code"><input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Optional" /></Field>
      </div>
      <Field label="Web address (slug)"><input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={slugify(name) || 'auto-generated from name'} /></Field>

      <Field label="Short description (shop grid)"><input value={short} onChange={(e) => setShort(e.target.value)} placeholder="One line shown on the shop listing" /></Field>
      <Field label="Full description"><textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>

      <Field label="Photos (one path or URL per line)">
        <textarea rows={2} value={images} onChange={(e) => setImages(e.target.value)} placeholder={'assets/Shop Media/hitch-main.jpg\nhttps://…/photo2.jpg'} />
      </Field>

      <div className="field-label" style={{ marginTop: 6 }}>Specifications</div>
      {specs.map((s, i) => (
        <div key={i} className="order-line" style={{ gridTemplateColumns: '1fr 1fr 36px' }}>
          <input value={s.label} onChange={(e) => setSpec(i, { label: e.target.value })} placeholder="e.g. Pin size" />
          <input value={s.value} onChange={(e) => setSpec(i, { value: e.target.value })} placeholder="e.g. 45 mm" />
          <button className="row-remove" aria-label="Remove spec" onClick={() => removeSpec(i)}><TrashIcon size={16} /></button>
        </div>
      ))}
      <button className="link-btn" onClick={addSpec}><PlusIcon size={14} /> Add specification</button>

      <label className="fld-check" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active (available to sell on the website)
      </label>
    </Modal>
  )
}
