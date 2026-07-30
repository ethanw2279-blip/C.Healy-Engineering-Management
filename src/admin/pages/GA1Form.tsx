import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button, Field } from '../components/ui'
import { nextNumber, today } from '../formParts'
import { useStore, newId } from '../../data/store'
import { RESULT_LABELS, addMonths } from '../../data/ga1'
import EquipmentSelect from '../../components/EquipmentSelect'
import type { GA1Inspection, GA1Result } from '../../data/types'

const RESULTS: GA1Result[] = ['safe', 'repair_required', 'unsafe']

export default function GA1Form() {
  const { id } = useParams()
  const nav = useNavigate()
  const { state, dispatch } = useStore()
  const existing = id ? state.ga1.find((g) => g.id === id) : undefined
  const isEdit = Boolean(existing)

  const [f, setF] = useState<GA1Inspection>(
    existing ?? {
      id: newId('g'),
      reportNumber: nextNumber('GA1-', state.ga1.map((g) => g.reportNumber)),
      clientId: '',
      examinerId: '',
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
      signature: '',
      purposeOfExamination: '12 Monthly Testing',
      particularsOfTests: '',
      createdAt: new Date().toISOString(),
    },
  )
  const set = (patch: Partial<GA1Inspection>) => setF({ ...f, ...patch })

  const save = () => {
    if (!f.clientId || !f.examinerId) return
    dispatch({ type: isEdit ? 'UPDATE_GA1' : 'ADD_GA1', inspection: f })
    nav(`/ga1/${f.id}`)
  }

  return (
    <div className="ga1-form">
      <Link className="back-link" to="/ga1">← GA1 Inspections</Link>
      <div className="page-head">
        <div>
          <h1 className="page-title">{isEdit ? `Edit ${f.reportNumber}` : 'New GA1 inspection'}</h1>
          <p className="page-sub">Report {f.reportNumber}</p>
        </div>
        <div className="detail-actions">
          <Button variant="secondary" onClick={() => nav(isEdit ? `/ga1/${f.id}` : '/ga1')}>Cancel</Button>
          <Button onClick={save} disabled={!f.clientId || !f.examinerId}>{isEdit ? 'Save changes' : 'Create report'}</Button>
        </div>
      </div>

      <FormCard title="Client & examiner">
        <div className="field-row">
          <Field label="Client">
            <select value={f.clientId} onChange={(e) => set({ clientId: e.target.value })}>
              <option value="">Select a client…</option>
              {state.clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
            </select>
          </Field>
          <Field label="Competent person (examiner)">
            <select value={f.examinerId} onChange={(e) => set({ examinerId: e.target.value })}>
              <option value="">Select a team member…</option>
              {state.employees.filter((e) => e.active).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </Field>
          <Field label="Examiner cert no."><input value={f.examinerCert} onChange={(e) => set({ examinerCert: e.target.value })} /></Field>
        </div>
      </FormCard>

      <FormCard title="Equipment">
        <div className="field-row">
          <Field label="Equipment type">
            <EquipmentSelect value={f.equipmentType} onChange={(v) => set({ equipmentType: v })} />
          </Field>
          <Field label="Manufacturer"><input value={f.manufacturer} onChange={(e) => set({ manufacturer: e.target.value })} /></Field>
          <Field label="Model"><input value={f.model} onChange={(e) => set({ model: e.target.value })} /></Field>
        </div>
        <div className="field-row">
          <Field label="Serial number"><input value={f.serialNumber} onChange={(e) => set({ serialNumber: e.target.value })} /></Field>
          <Field label="SWL / WLL"><input value={f.swl} onChange={(e) => set({ swl: e.target.value })} placeholder="e.g. 4,000 kg" /></Field>
          <Field label="Year of manufacture"><input value={f.yearOfManufacture} onChange={(e) => set({ yearOfManufacture: e.target.value })} /></Field>
        </div>
        <Field label="Description"><input value={f.equipmentDescription} onChange={(e) => set({ equipmentDescription: e.target.value })} /></Field>
      </FormCard>

      <FormCard title="Examination">
        <div className="field-row">
          <Field label="Date of examination">
            <input type="date" value={f.examinationDate} onChange={(e) => set({ examinationDate: e.target.value, nextExaminationDate: addMonths(e.target.value, 12) })} />
          </Field>
          <Field label="Previous examination"><input type="date" value={f.previousExaminationDate} onChange={(e) => set({ previousExaminationDate: e.target.value })} /></Field>
          <Field label="Next examination due"><input type="date" value={f.nextExaminationDate} onChange={(e) => set({ nextExaminationDate: e.target.value })} /></Field>
        </div>
        <div className="field-row">
          <Field label="Examination location"><input value={f.examinationLocation} onChange={(e) => set({ examinationLocation: e.target.value })} /></Field>
          <Field label="Purpose of examination"><input value={f.purposeOfExamination} onChange={(e) => set({ purposeOfExamination: e.target.value })} /></Field>
        </div>
        <Field label="Particulars of tests"><input value={f.particularsOfTests} onChange={(e) => set({ particularsOfTests: e.target.value })} /></Field>
      </FormCard>

      <FormCard title="Result">
        <div className="ga1-checks">
          <label className="ga1-check"><input type="checkbox" checked={f.safeToUse} onChange={(e) => set({ safeToUse: e.target.checked })} /> Safe to use</label>
          <label className="ga1-check"><input type="checkbox" checked={f.defectsFound} onChange={(e) => set({ defectsFound: e.target.checked })} /> Defects found during examination</label>
        </div>
        <div className="field-row">
          <Field label="Overall result">
            <select value={f.overallResult} onChange={(e) => set({ overallResult: e.target.value as GA1Result })}>
              {RESULTS.map((r) => <option key={r} value={r}>{RESULT_LABELS[r]}</option>)}
            </select>
          </Field>
          <Field label="Re-inspection / repair by"><input type="date" value={f.reinspectionDate} onChange={(e) => set({ reinspectionDate: e.target.value })} /></Field>
        </div>
        <Field label="Defects / actions required"><textarea rows={3} value={f.defectsDescription} onChange={(e) => set({ defectsDescription: e.target.value })} /></Field>
        <Field label="Additional notes"><textarea rows={2} value={f.additionalNotes} onChange={(e) => set({ additionalNotes: e.target.value })} /></Field>
        <Field label="Examiner signature (typed)"><input value={f.signature} onChange={(e) => set({ signature: e.target.value })} placeholder="Full name" /></Field>
      </FormCard>
    </div>
  )
}

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="detail-section">
      <div className="detail-section-title">{title}</div>
      <div className="card" style={{ padding: '18px' }}>{children}</div>
    </div>
  )
}
