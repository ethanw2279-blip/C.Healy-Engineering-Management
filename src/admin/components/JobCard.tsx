import { Fragment, useState } from 'react'
import { Button, Avatar } from './ui'
import { PlusIcon } from '../../components/Icons'
import { useStore, useCurrentUser, newId, eurExact, formatDate } from '../../data/store'
import type { JobStage, StageEntry } from '../../data/types'
import {
  entriesOf, entryHours, fmtHours, jobCardHours, moveStage, newStage, stageCrew, stageHours, stageStatus, stagesOf, stopTimer,
  STAGE_LABEL, STAGE_TONE,
} from '../../data/jobCard'
import { runAll } from '../../data/stock'
import { useNow } from '../../data/useNow'
import StageSheet from '../../screens/StageSheet'
import JobCardConvert, { savedRate } from './JobCardConvert'
import '../../components/stock.css'
import '../../components/jobcard.css'

// The Job card section on the office job page: stages, hours per stage and
// per person, templates, and turning it into a quote or invoice.
export default function JobCard({ jobId }: { jobId: string }) {
  const { state, dispatch } = useStore()
  const { can } = useCurrentUser()
  const canManage = can('create:records')
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [log, setLog] = useState<{ stage?: JobStage; entry?: StageEntry } | null>(null)
  const [converting, setConverting] = useState(false)

  const stages = stagesOf(state, jobId)
  const now = useNow(state.stageEntries.some((e) => e.jobId === jobId && e.startedAt))
  const rate = savedRate()
  const total = jobCardHours(state, jobId, now)
  const doneCount = stages.filter((s) => s.done).length

  const toggle = (id: string) => setOpen((o) => {
    const n = new Set(o)
    if (n.has(id)) n.delete(id); else n.add(id)
    return n
  })

  const addStage = () => {
    const name = prompt('Stage name, e.g. "Fully weld frame"')
    if (name?.trim()) dispatch({ type: 'ADD_JOB_STAGE', stage: newStage(state, jobId, name) })
  }
  const rename = (s: JobStage) => {
    const name = prompt('Stage name', s.name)
    if (name?.trim() && name.trim() !== s.name) dispatch({ type: 'UPDATE_JOB_STAGE', stage: { ...s, name: name.trim() } })
  }
  const remove = (s: JobStage) => {
    const n = entriesOf(state, s.id).length
    if (confirm(n ? `Remove "${s.name}" and the ${n} time entr${n === 1 ? 'y' : 'ies'} on it?` : `Remove "${s.name}"?`))
      dispatch({ type: 'REMOVE_JOB_STAGE', id: s.id })
  }
  const loadTemplate = (id: string) => {
    const t = state.stageTemplates.find((x) => x.id === id)
    if (!t) return
    t.stages.forEach((n, i) => dispatch({ type: 'ADD_JOB_STAGE', stage: newStage(state, jobId, n, i) }))
  }
  const saveTemplate = () => {
    const job = state.jobs.find((j) => j.id === jobId)
    const name = prompt('Template name, e.g. "Man basket"', job?.title ?? '')
    if (!name?.trim()) return
    dispatch({ type: 'ADD_STAGE_TEMPLATE', template: { id: newId('tpl'), name: name.trim(), stages: stages.map((s) => s.name), createdAt: new Date().toISOString() } })
    alert(`Saved "${name.trim()}". Load it on another job from Load template.`)
  }
  const removeTemplate = () => {
    const names = state.stageTemplates.map((t, i) => `${i + 1}. ${t.name}`).join('\n')
    const pick = prompt(`Which template should be removed? Type its number.\n\n${names}`)
    const t = state.stageTemplates[Number(pick) - 1]
    if (t && confirm(`Remove the "${t.name}" template?`)) dispatch({ type: 'REMOVE_STAGE_TEMPLATE', id: t.id })
  }

  return (
    <div className="detail-section">
      <div className="detail-section-title">
        <span>Job card ({stages.length} stage{stages.length === 1 ? '' : 's'}){stages.length > 0 && <span className="jc-dim"> · {doneCount} of {stages.length} done · {fmtHours(total)}</span>}</span>
        <div className="jc-actions">
          <Button variant="secondary" size="sm" onClick={addStage}><PlusIcon size={14} /> Add stage</Button>
          <Button variant="secondary" size="sm" onClick={() => setLog({})}>Log time</Button>
          {state.stageTemplates.length > 0 && (
            <select
              className="btn btn-secondary btn-sm"
              value=""
              onChange={(e) => (e.target.value === '__remove' ? removeTemplate() : loadTemplate(e.target.value))}
            >
              <option value="">Load template…</option>
              {state.stageTemplates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.stages.length} stages)</option>)}
              {canManage && <option value="__remove">Remove a template…</option>}
            </select>
          )}
          {canManage && stages.length > 0 && <Button variant="secondary" size="sm" onClick={saveTemplate}>Save as template</Button>}
          {canManage && stages.length > 0 && <Button size="sm" onClick={() => setConverting(true)}>Turn into quote / invoice</Button>}
        </div>
      </div>
      <div className="card">
        <table className="table jc-table">
          <thead>
            <tr>
              <th style={{ width: 96 }}>#</th><th>Stage</th><th>Who</th><th>Status</th>
              <th className="num">Hours</th><th className="num">Labour at {eurExact(rate)}/h</th><th style={{ width: 210 }} />
            </tr>
          </thead>
          <tbody>
            {stages.length === 0 && (
              <tr><td colSpan={7} className="cell-muted">
                No stages yet. Add the stages of the job{state.stageTemplates.length ? ' or load a template' : ''}, and the crew can log how long each one takes from the field app.
              </td></tr>
            )}
            {stages.map((s, i) => {
              const status = stageStatus(state, s)
              const crew = stageCrew(state, s.id)
              const hrs = stageHours(state, s.id, now)
              const entries = entriesOf(state, s.id)
              const isOpen = open.has(s.id)
              return (
                <Fragment key={s.id}>
                  <tr className="clickable" onClick={() => toggle(s.id)}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="jc-arrows" onClick={(e) => e.stopPropagation()}>
                        <button disabled={i === 0} aria-label="Move up" onClick={() => runAll(dispatch, moveStage(state, s, -1))}>▲</button>
                        <button disabled={i === stages.length - 1} aria-label="Move down" onClick={() => runAll(dispatch, moveStage(state, s, 1))}>▼</button>
                      </span>
                      {' '}{i + 1}
                    </td>
                    <td className="cell-strong">{s.name}</td>
                    <td>
                      {crew.length ? <span className="jc-faces">{crew.map((e) => <Avatar key={e.id} name={e.name} color={e.color} size={26} />)}</span> : <span className="cell-muted">–</span>}
                    </td>
                    <td>
                      <button
                        className={`stk-pill stk-${STAGE_TONE[status]} jc-status`}
                        title={s.done ? 'Mark as not done' : 'Mark as done'}
                        onClick={(e) => { e.stopPropagation(); dispatch({ type: 'UPDATE_JOB_STAGE', stage: { ...s, done: !s.done } }) }}
                      >
                        {STAGE_LABEL[status]}
                      </button>
                    </td>
                    <td className="num cell-strong">{hrs > 0 ? fmtHours(hrs) : '–'}</td>
                    <td className="num">{hrs > 0 ? eurExact(Math.round(hrs * 10) / 10 * rate) : '–'}</td>
                    <td className="num" style={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                      <button className="row-action" onClick={() => setLog({ stage: s })}>Log</button>
                      <button className="row-action" onClick={() => rename(s)}>Rename</button>
                      <button className="row-action danger" onClick={() => remove(s)}>Remove</button>
                    </td>
                  </tr>
                  {isOpen && entries.length === 0 && (
                    <tr className="jc-sub"><td /><td colSpan={6}>No time logged on this stage yet.</td></tr>
                  )}
                  {isOpen && entries.map((e) => {
                    const who = state.employees.find((x) => x.id === e.employeeId)
                    return (
                      <tr key={e.id} className="jc-sub">
                        <td />
                        <td colSpan={3}>
                          {who?.name ?? 'Someone'} · {formatDate(e.date)}{e.note ? ` · “${e.note}”` : ''}
                          {e.startedAt && <span className="stk-pill stk-blue sm" style={{ marginLeft: 8 }}>Timer on</span>}
                        </td>
                        <td className="num">{fmtHours(entryHours(e, now))}</td>
                        <td />
                        <td className="num" style={{ whiteSpace: 'nowrap' }}>
                          {e.startedAt && <button className="row-action" onClick={() => dispatch(stopTimer(e))}>Stop</button>}
                          <button className="row-action" onClick={() => setLog({ entry: e })}>Edit</button>
                          <button className="row-action danger" onClick={() => confirm('Remove this time?') && dispatch({ type: 'REMOVE_STAGE_ENTRY', id: e.id })}>Remove</button>
                        </td>
                      </tr>
                    )
                  })}
                </Fragment>
              )
            })}
            {stages.length > 0 && (
              <tr>
                <td colSpan={4} className="num cell-strong">Total</td>
                <td className="num cell-strong">{fmtHours(total)}</td>
                <td className="num cell-strong">{eurExact(Math.round(total * 10) / 10 * rate)}</td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="cell-muted" style={{ fontSize: 12.5, marginTop: 8 }}>Click a stage to see each person’s time. Job card hours are kept separate from timesheets.</p>
      {log && <StageSheet inModal jobId={jobId} stage={log.stage} entry={log.entry} onClose={() => setLog(null)} />}
      {converting && <JobCardConvert jobId={jobId} onClose={() => setConverting(false)} />}
    </div>
  )
}
