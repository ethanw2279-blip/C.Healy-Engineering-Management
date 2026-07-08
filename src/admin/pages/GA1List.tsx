import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, Button, EmptyState } from '../components/ui'
import { TrashIcon } from '../../components/Icons'
import { useStore, useCurrentUser, formatDate } from '../../data/store'
import { RESULT_LABELS, resultTone, isOverdue } from '../../data/ga1'
import type { GA1Inspection } from '../../data/types'

const filters = ['All', 'safe', 'repair_required', 'unsafe'] as const

export default function GA1List() {
  const { state, dispatch } = useStore()
  const { can } = useCurrentUser()
  const nav = useNavigate()
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')

  const clientName = (id: string) => state.clients.find((c) => c.id === id)?.name ?? 'Unknown'
  const rows = state.ga1.filter((g) => filter === 'All' || g.overallResult === filter)
  const canManage = can('create:records')

  const remove = (e: React.MouseEvent, g: GA1Inspection) => {
    e.stopPropagation()
    if (confirm(`Delete inspection ${g.reportNumber}?`)) dispatch({ type: 'REMOVE_GA1', id: g.id })
  }

  return (
    <div>
      <PageHeader
        title="GA1 Inspections"
        subtitle={`${state.ga1.length} reports`}
        action={canManage && <Button onClick={() => nav('/ga1/new')}>New inspection</Button>}
      />

      <div className="toolbar">
        {filters.map((f) => (
          <button key={f} className={`tab-filter ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
            {f === 'All' ? 'All' : RESULT_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="card">
        {rows.length === 0 ? (
          <EmptyState title="No inspections" hint="Create a GA1 inspection report." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Report</th>
                <th>Client</th>
                <th>Equipment</th>
                <th>Examined</th>
                <th>Next due</th>
                <th>Result</th>
                {canManage && <th />}
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id} className="clickable" onClick={() => nav(`/ga1/${g.id}`)}>
                  <td className="cell-strong">{g.reportNumber}</td>
                  <td>{clientName(g.clientId)}</td>
                  <td>
                    <div className="stack-tight">
                      <span>{g.equipmentType || '—'}</span>
                      <span className="cell-muted">{[g.manufacturer, g.model].filter(Boolean).join(' ')}</span>
                    </div>
                  </td>
                  <td className="cell-muted">{formatDate(g.examinationDate)}</td>
                  <td className={isOverdue(g.nextExaminationDate) ? 'ga1-overdue' : 'cell-muted'}>
                    {formatDate(g.nextExaminationDate)}
                    {isOverdue(g.nextExaminationDate) && ' · overdue'}
                  </td>
                  <td><span className={`badge badge-${resultTone[g.overallResult]}`}>{RESULT_LABELS[g.overallResult]}</span></td>
                  {canManage && (
                    <td className="num">
                      <button className="row-remove" aria-label={`Delete ${g.reportNumber}`} onClick={(e) => remove(e, g)}>
                        <TrashIcon size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="table-hint">Tip: click a report to view details and download the PDF.</p>
    </div>
  )
}
