import { useState } from 'react'
import { useStore, newId } from '../data/store'
import { todayISO } from '../mobile/fieldHelpers'
import './field.css'
import './Timesheet.css'

// Quick "new client" for the field app (creates a Lead).
export default function NewClientSheet({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')

  const valid = name.trim().length > 0

  const save = () => {
    if (!valid) return
    dispatch({
      type: 'ADD_CLIENT',
      client: {
        id: newId('c'), name: name.trim(), company: company.trim() || undefined,
        email: email.trim(), phone: phone.trim(), address: address.trim(),
        status: 'Lead', createdAt: todayISO(),
      },
    })
    onClose()
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">New client</h2>
        <div className="fld-form-field"><label>Name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" /></div>
        <div className="fld-form-field"><label>Company (optional)</label><input value={company} onChange={(e) => setCompany(e.target.value)} /></div>
        <div className="sheet-row">
          <div className="fld-form-field"><label>Phone</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="fld-form-field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        </div>
        <div className="fld-form-field"><label>Address</label><input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
        <button className="fld-save" onClick={save} disabled={!valid}>Save client</button>
      </div>
    </div>
  )
}
