import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckIcon, PlusIcon } from '../components/Icons'
import { Avatar } from '../admin/components/ui'
import { useStore, useCurrentUser } from '../data/store'
import type { JobStage, StageEntry } from '../data/types'
import {
  entryHours, fmtClock, fmtHours, jobCardHours, myRunningEntry, newStage, stageCrew, stageHours, stageStatus,
  stagesOf, stopTimer,
} from '../data/jobCard'
import { useNow } from '../data/useNow'
import StageSheet from './StageSheet'
import './JobView.css'
import '../components/jobcard.css'

// The Job card tab in the field app: the stages of the job, who worked on
// each and for how long, and a timer for the stage you're on now.
export default function JobCard({ jobId }: { jobId: string }) {
  const { state, dispatch } = useStore()
  const { user, can } = useCurrentUser()
  const nav = useNavigate()
  const [sheet, setSheet] = useState<{ stage?: JobStage } | null>(null)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const stages = stagesOf(state, jobId)
  const mine = myRunningEntry(state, user?.id)
  const anyRunning = state.stageEntries.some((e) => e.jobId === jobId && e.startedAt)
  const now = useNow(!!mine || anyRunning)

  const addStage = () => {
    if (!name.trim()) return
    dispatch({ type: 'ADD_JOB_STAGE', stage: newStage(state, jobId, name) })
    setName('')
  }

  const applyTemplate = (names: string[]) =>
    names.forEach((n, i) => dispatch({ type: 'ADD_JOB_STAGE', stage: newStage(state, jobId, n, i) }))

  return (
    <>
      {mine && <TimerBar entry={mine} here={mine.jobId === jobId} now={now} onStop={() => dispatch(stopTimer(mine))} onOpen={() => nav(`/field/job/${mine.jobId}?tab=card`)} />}

      <h3 className="fld-h3">Stages</h3>
      <div className="fld-card">
        {stages.length === 0 && (
          <div className="stk-empty">
            Break the job into stages, like “Cut and prep stock” or “Fully weld frame”, and log how long each one takes.
            {state.stageTemplates.length > 0 && (
              <>
                <div style={{ marginTop: 10, fontWeight: 700, color: 'var(--navy)' }}>Start from a template</div>
                <div className="jc-tpls">
                  {state.stageTemplates.map((t) => <button key={t.id} onClick={() => applyTemplate(t.stages)}>{t.name}</button>)}
                </div>
              </>
            )}
          </div>
        )}
        {stages.map((s, i) => {
          const status = stageStatus(state, s)
          const crew = stageCrew(state, s.id)
          const hrs = stageHours(state, s.id, now)
          return (
            <button key={s.id} className="jc-stage" onClick={() => setSheet({ stage: s })}>
              <span className={`jc-num ${status === 'done' ? 'done' : status === 'running' ? 'running' : ''}`}>
                {status === 'done' ? <CheckIcon size={14} /> : i + 1}
              </span>
              <span className="jc-mid">
                <strong>{s.name}</strong>
                <span className="jc-who">
                  {crew.length > 0 ? (
                    <>
                      <span className="jc-faces">{crew.map((e) => <Avatar key={e.id} name={e.name} color={e.color} size={20} />)}</span>
                      {crew.map((e) => (e.id === user?.id ? 'you' : e.name.split(' ')[0])).join(', ')}
                    </>
                  ) : 'Nobody yet'}
                </span>
              </span>
              <span className="jc-hrs">
                <b>{hrs > 0 ? fmtHours(hrs) : '–'}</b>
                <small className={status === 'running' ? 'running' : ''}>
                  {status === 'done' ? 'Done' : status === 'running' ? '● Running' : status === 'started' ? 'In progress' : 'Start ›'}
                </small>
              </span>
            </button>
          )
        })}
        {adding ? (
          <div className="jc-new">
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addStage()} placeholder="Stage name" />
            <button onClick={addStage} disabled={!name.trim()}>Add</button>
            <button style={{ background: 'none', color: 'var(--navy-muted)' }} onClick={() => { setAdding(false); setName('') }}>Done</button>
          </div>
        ) : (
          <button className="stk-add" onClick={() => setAdding(true)}><PlusIcon size={18} /> Add a stage</button>
        )}
        {stages.length > 0 && (
          <div className="jc-total"><span>Total on this job</span><span>{fmtHours(jobCardHours(state, jobId, now))}</span></div>
        )}
      </div>
      {stages.length > 0 && (
        <p className="muted-sub jv-hint" style={{ paddingBottom: 72 }}>Tap a stage to start the timer or type in your hours. This is just for the job card{can('view:timesheets') ? ', it doesn’t go on your timesheet' : ''}.</p>
      )}
      {sheet && <StageSheet jobId={jobId} stage={sheet.stage} onClose={() => setSheet(null)} />}
    </>
  )
}

function TimerBar({ entry, here, now, onStop, onOpen }: { entry: StageEntry; here: boolean; now: number; onStop: () => void; onOpen: () => void }) {
  const { state } = useStore()
  const stage = state.jobStages.find((s) => s.id === entry.stageId)
  const job = state.jobs.find((j) => j.id === entry.jobId)
  return (
    <div className={`jc-timer${here ? '' : ' elsewhere'}`}>
      <span className="jc-timer-dot" />
      <button className="jc-timer-text" style={{ textAlign: 'left', color: 'inherit' }} onClick={here ? undefined : onOpen}>
        <small>{here ? 'You’re on' : `Timer running on ${job?.number ?? 'another job'}`}</small>
        <strong>{stage?.name ?? 'A stage'}</strong>
      </button>
      <span className="jc-timer-clock">{fmtClock(entryHours(entry, now))}</span>
      <button className="jc-timer-stop" onClick={onStop}>Stop</button>
    </div>
  )
}
