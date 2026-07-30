import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore, useCurrentUser, newId } from '../data/store'
import { RESULT_LABELS, addMonths } from '../data/ga1'
import EquipmentSelect from '../components/EquipmentSelect'
import type { GA1Inspection, GA1Result } from '../data/types'
import './screens.css'
import './field.css'
import './JobView.css'

const RESULTS: GA1Result[] = ['safe', 'repair_required', 'unsafe']
const today = () => new Date().toISOString().slice(0, 10)

// Defined at module scope (not inside the component) so it stays a stable
// component type — otherwise React remounts its children on every keystroke,
// wiping any internal state (e.g. the equipment "add new" toggle).
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="fld-form-field"><label>{label}</label>{children}</div>
)

function nextReport(existing: string[]) {
  // Parse the digits after "GA1-" (not all digits — the "1" in GA1 would
  // otherwise fold in and make numbers balloon each time). Ignore corrupted
  // out-of-range numbers, and bound the de-dupe loop so it can never hang.
  const nums = existing
    .map((n) => parseInt(String(n).replace(/^GA1-/i, '').replace(/\D/g, ''), 10))
    .filter((n) => Number.isSafeInteger(n))
  let next = (nums.length ? Math.max(...nums) : 1000) + 1
  const used = new Set(existing)
  for (let guard = 0; used.has(`GA1-${next}`) && guard < 100000; guard++) next++
  return `GA1-${next}`
}

export default function FieldGA1Form() {
  const { id } = useParams()
  const nav = useNavigate()
  const { state, dispatch } = useStore()
  const { user } = useCurrentUser()
  const existing = id ? state.ga1.find((g) => g.id === id) : undefined
  const isEdit = !!existing

  const [f, setF] = useState<GA1Inspection>(
    existing ?? {
      id: newId('g'),
      reportNumber: nextReport(state.ga1.map((g) => g.reportNumber)),
      clientId: '',
      examinerId: user?.id ?? '',
      examinerCert: '',
      equipmentType: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      swl: '',
      yearOfManufacture: '',
      equipmentDescription: '',
      examinationDate: today(),
      previousExaminationDate: '',
      nextExaminationDate: addMonths(today(), 12),
      examinationLocation: '',
      safeToUse: true,
      defectsFound: false,
      overallResult: 'safe',
      defectsDescription: '',
      reinspectionDate: '',
      additionalNotes: '',
      signature: user?.name ?? '',
      purposeOfExamination: '12 Monthly Testing',
      particularsOfTests: '',
      createdAt: new Date().toISOString(),
    },
  )
  const set = (patch: Partial<GA1Inspection>) => setF({ ...f, ...patch })

  const save = () => {
    if (!f.clientId) return
    dispatch({ type: isEdit ? 'UPDATE_GA1' : 'ADD_GA1', inspection: f })
    nav(`/field/ga1/${f.id}`)
  }

  return (
    <div>
      <div className="fld-topbar">
        <div className="fld-topbar-left">
          <button className="fld-back" onClick={() => nav(-1)}>←</button>
          <span>{isEdit ? f.reportNumber : 'New inspection'}</span>
        </div>
      </div>

      <div className="pad">
        <Field label="Client">
          <select value={f.clientId} onChange={(e) => set({ clientId: e.target.value })}>
            <option value="">Select a client…</option>
            {state.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Examiner">
          <select value={f.examinerId} onChange={(e) => set({ examinerId: e.target.value })}>
            {state.employees.filter((e) => e.active).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </Field>
        <Field label="Equipment type">
          <EquipmentSelect value={f.equipmentType} onChange={(v) => set({ equipmentType: v })} />
        </Field>
        <Field label="Manufacturer"><input value={f.manufacturer} onChange={(e) => set({ manufacturer: e.target.value })} /></Field>
        <Field label="Model"><input value={f.model} onChange={(e) => set({ model: e.target.value })} /></Field>
        <Field label="Serial number"><input value={f.serialNumber} onChange={(e) => set({ serialNumber: e.target.value })} /></Field>
        <Field label="SWL / WLL"><input value={f.swl} onChange={(e) => set({ swl: e.target.value })} placeholder="e.g. 4,000 kg" /></Field>
        <Field label="Year of manufacture"><input value={f.yearOfManufacture} onChange={(e) => set({ yearOfManufacture: e.target.value })} /></Field>
        <Field label="Examination date">
          <input type="date" value={f.examinationDate} onChange={(e) => set({ examinationDate: e.target.value, nextExaminationDate: addMonths(e.target.value, 12) })} />
        </Field>
        <Field label="Next examination due"><input type="date" value={f.nextExaminationDate} onChange={(e) => set({ nextExaminationDate: e.target.value })} /></Field>
        <Field label="Examination location"><input value={f.examinationLocation} onChange={(e) => set({ examinationLocation: e.target.value })} /></Field>

        <label className="fld-check"><input type="checkbox" checked={f.safeToUse} onChange={(e) => set({ safeToUse: e.target.checked })} /> Safe to use</label>
        <label className="fld-check"><input type="checkbox" checked={f.defectsFound} onChange={(e) => set({ defectsFound: e.target.checked })} /> Defects found</label>

        <Field label="Overall result">
          <select value={f.overallResult} onChange={(e) => set({ overallResult: e.target.value as GA1Result })}>
            {RESULTS.map((r) => <option key={r} value={r}>{RESULT_LABELS[r]}</option>)}
          </select>
        </Field>
        <Field label="Defects / actions required"><textarea rows={3} value={f.defectsDescription} onChange={(e) => set({ defectsDescription: e.target.value })} /></Field>
        <Field label="Examiner signature"><input value={f.signature} onChange={(e) => set({ signature: e.target.value })} placeholder="Full name" /></Field>

        <button className="fld-save" onClick={save} disabled={!f.clientId}>{isEdit ? 'Save changes' : 'Create inspection'}</button>
      </div>
    </div>
  )
}
