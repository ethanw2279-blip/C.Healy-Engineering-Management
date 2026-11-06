import { useState } from 'react'
import SheetOrModal from '../components/SheetOrModal'
import { useStore, useCurrentUser, newId } from '../data/store'
import type { JobStage, StageEntry } from '../data/types'
import { entriesOf, fmtHours, newStage, runningHours, startTimer, stagesOf, todayIso } from '../data/jobCard'
import { runAll } from '../data/stock'
import { fmtDayShort } from '../mobile/fieldHelpers'
import './field.css'
import '../components/stock.css'
import '../components/jobcard.css'

const NEW = '__new__'
const CHIPS = [0.5, 1, 2, 4, 8]

// Log time on a job card stage: start a timer or type in the hours. Also edits
// an existing entry. The office shows the same form in a modal (`inModal`) and
// can log time for anyone.
export default function StageSheet({ jobId, stage, entry, inModal, onClose }: {
  jobId: string
  stage?: JobStage
  entry?: StageEntry
  inModal?: boolean
  onClose: () => void
}) {
  const { state, dispatch } = useStore()
  const { user, can } = useCurrentUser()
  const office = can('create:records')
  const stages = stagesOf(state, jobId)

  const [editing, setEditing] = useState<StageEntry | undefined>(entry)
  const [stageId, setStageId] = useState(entry?.stageId ?? stage?.id ?? stages.find((s) => !s.done)?.id ?? stages[0]?.id ?? NEW)
  const [newName, setNewName] = useState('')
  const [mode, setMode] = useState<'timer' | 'hours'>(entry || inModal ? 'hours' : 'timer')
  const [hours, setHours] = useState(entry?.hours ?? 1)
  const [date, setDate] = useState(entry?.date ?? todayIso())
  const [note, setNote] = useState(entry?.note ?? '')
  const [employeeId, setEmployeeId] = useState(entry?.employeeId ?? user?.id ?? '')
  const current = stages.find((s) => s.id === stageId)
  const [markDone, setMarkDone] = useState(current?.done ?? false)

  const pickStage = (id: string) => {
    setStageId(id)
    setMarkDone(stages.find((s) => s.id === id)?.done ?? false)
  }

  const loadEntry = (e: StageEntry) => {
    setEditing(e)
    setMode('hours')
    setHours(Math.round((e.hours + runningHours(e)) * 100) / 100)
    setDate(e.date)
    setNote(e.note ?? '')
    setEmployeeId(e.employeeId ?? '')
  }

  const running = !!editing?.startedAt
  const timer = mode === 'timer' && !editing
  const valid = (stageId !== NEW || newName.trim().length > 0) && (timer || hours > 0) && !!employeeId

  // The stage to log against, creating it first if it's new.
  const resolveStage = (): JobStage => {
    if (stageId !== NEW && current) return current
    const st = newStage(state, jobId, newName)
    dispatch({ type: 'ADD_JOB_STAGE', stage: st })
    return st
  }

  const save = () => {
    if (!valid) return
    const st = resolveStage()
    if (timer) {
      runAll(dispatch, startTimer(state, st, employeeId))
    } else if (editing) {
      dispatch({
        type: 'UPDATE_STAGE_ENTRY',
        entry: { ...editing, stageId: st.id, employeeId, date, hours, note: note.trim() || undefined, startedAt: undefined },
      })
    } else {
      dispatch({
        type: 'ADD_STAGE_ENTRY',
        entry: {
          id: newId('se'), stageId: st.id, jobId, employeeId, date, hours,
          note: note.trim() || undefined, createdAt: new Date().toISOString(),
        },
      })
    }
    if (markDone !== st.done) dispatch({ type: 'UPDATE_JOB_STAGE', stage: { ...st, done: markDone } })
    onClose()
  }

  const remove = () => {
    if (!editing || !confirm('Remove this time from the job card?')) return
    dispatch({ type: 'REMOVE_STAGE_ENTRY', id: editing.id })
    onClose()
  }

  const canEdit = (e: StageEntry) => office || e.employeeId === user?.id
  const logged = current ? entriesOf(state, current.id) : []
  const nameOf = (id?: string) => state.employees.find((e) => e.id === id)?.name ?? 'Someone'

  return (
    <SheetOrModal title={editing ? 'Edit time' : 'Log time'} inModal={inModal} onClose={onClose}>
      <div className="fld-form-field">
        <label>Stage</label>
        <select value={stageId} onChange={(e) => pickStage(e.target.value)}>
          {stages.map((s) => <option key={s.id} value={s.id}>{s.name}{s.done ? ' (done)' : ''}</option>)}
          <option value={NEW}>+ New stage…</option>
        </select>
      </div>
      {stageId === NEW && (
        <div className="fld-form-field">
          <label>New stage name</label>
          <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Fully weld frame" />
        </div>
      )}

      {office && (
        <div className="fld-form-field">
          <label>Who</label>
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">Choose someone</option>
            {state.employees.filter((e) => e.active || e.id === employeeId).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      )}

      {!editing && (
        <div className="stk-seg">
          <button type="button" className={mode === 'timer' ? 'on' : ''} onClick={() => setMode('timer')}>Start timer</button>
          <button type="button" className={mode === 'hours' ? 'on' : ''} onClick={() => setMode('hours')}>Type hours</button>
        </div>
      )}

      {timer ? (
        <p className="fld-form-hint" style={{ marginTop: 0 }}>
          The timer runs until you stop it, even if you close the app. Starting it stops any other timer you have running.
        </p>
      ) : (
        <>
          {running && <p className="fld-form-hint" style={{ marginTop: 0 }}>This timer is still running. Saving stops it at the hours below.</p>}
          <div className="sheet-row">
            <div className="fld-form-field">
              <label>Hours</label>
              <div className="stk-step">
                <button type="button" onClick={() => setHours((h) => Math.max(0.25, Math.round((h - 0.5) * 100) / 100))}>−</button>
                <input inputMode="decimal" value={hours} onChange={(e) => setHours(Math.max(0, Number(e.target.value.replace(',', '.')) || 0))} />
                <button type="button" onClick={() => setHours((h) => Math.round((h + 0.5) * 100) / 100)}>+</button>
              </div>
            </div>
            <div className="fld-form-field">
              <label>Day</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="jc-chips">
            {CHIPS.map((c) => <button key={c} type="button" className={hours === c ? 'on' : ''} onClick={() => setHours(c)}>{c}h</button>)}
          </div>
          <div className="fld-form-field">
            <label>Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. two coats of yellow" />
          </div>
        </>
      )}

      <label className="jc-check">
        <input type="checkbox" checked={markDone} onChange={(e) => setMarkDone(e.target.checked)} />
        Mark this stage as done
      </label>

      <button className="fld-save" style={{ width: '100%' }} disabled={!valid} onClick={save}>
        {timer ? 'Start timer' : editing ? 'Save' : `Save ${fmtHours(hours)}`}
      </button>
      {editing && canEdit(editing) && <button className="sheet-delete" onClick={remove}>Remove this time</button>}

      {!editing && logged.length > 0 && (
        <>
          <div className="fld-form-field" style={{ marginTop: 18, marginBottom: 6 }}><label>Logged on this stage</label></div>
          <div className="jc-log">
            {logged.map((e) => {
              const text = (
                <>
                  <span>{nameOf(e.employeeId)} · {fmtDayShort(e.date)}{e.note ? ` · ${e.note}` : ''}</span>
                  <b>{e.startedAt ? 'Running' : fmtHours(e.hours)}</b>
                </>
              )
              return canEdit(e)
                ? <button key={e.id} className="jc-log-row" onClick={() => loadEntry(e)}>{text}</button>
                : <div key={e.id} className="jc-log-row">{text}</div>
            })}
          </div>
        </>
      )}
    </SheetOrModal>
  )
}
