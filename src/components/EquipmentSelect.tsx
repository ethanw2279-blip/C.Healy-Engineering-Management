import { useState } from 'react'
import { EQUIPMENT_TYPES } from '../data/ga1'

const NEW = '__new__'

// Equipment-type picker: the standard list plus an "Add new type…" option that
// reveals a free-text field, so new equipment can be added on the fly.
// Styling comes from the parent form field (admin .field or .fld-form-field).
export default function EquipmentSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [adding, setAdding] = useState(!!value && !EQUIPMENT_TYPES.includes(value))

  return (
    <>
      <select
        value={adding ? NEW : value}
        onChange={(e) => {
          if (e.target.value === NEW) {
            setAdding(true)
            onChange('')
          } else {
            setAdding(false)
            onChange(e.target.value)
          }
        }}
      >
        <option value="">Select…</option>
        {EQUIPMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        <option value={NEW}>➕ Add new type…</option>
      </select>
      {adding && (
        <input
          autoFocus
          placeholder="Type the equipment type"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ marginTop: 8 }}
        />
      )}
    </>
  )
}
