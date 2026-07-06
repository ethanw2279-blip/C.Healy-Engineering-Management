import { useState } from 'react'
import { PageHeader, Button, StatusBadge, Avatar, EmptyState } from '../components/ui'
import { useStore, eur, jobTotal, formatDateShort } from '../../data/store'
import { useCreate } from '../useCreate'

const filters = ['All', 'Unscheduled', 'Scheduled', 'Active', 'Requires invoicing', 'Complete'] as const

export default function Jobs() {
  const { state } = useStore()
  const create = useCreate()
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')

  const clientById = (id: string) => state.clients.find((c) => c.id === id)?.name ?? 'Unknown'
  const rows = state.jobs.filter((j) => filter === 'All' || j.status === filter)

  return (
    <div>
      <PageHeader
        title="Jobs"
        subtitle={`${state.jobs.length} total`}
        action={<Button onClick={() => create('job')}>New job</Button>}
      />

      <div className="toolbar">
        {filters.map((f) => (
          <button key={f} className={`tab-filter ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="card">
        {rows.length === 0 ? (
          <EmptyState title="No jobs here" hint="Create a job or convert an approved quote." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Client</th>
                <th>Schedule</th>
                <th>Team</th>
                <th>Status</th>
                <th className="num">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => (
                <tr key={j.id}>
                  <td>
                    <div className="stack-tight">
                      <span className="cell-strong">{j.number}</span>
                      <span className="cell-muted">{j.title}</span>
                    </div>
                  </td>
                  <td>{clientById(j.clientId)}</td>
                  <td className="cell-muted">{j.startDate ? formatDateShort(j.startDate) : 'Unscheduled'}</td>
                  <td>
                    <div className="cell-with-avatar">
                      {j.assignedTo.length === 0 && <span className="cell-muted">—</span>}
                      {j.assignedTo.map((id) => {
                        const e = state.employees.find((x) => x.id === id)
                        return e ? <Avatar key={id} name={e.name} color={e.color} size={26} /> : null
                      })}
                    </div>
                  </td>
                  <td><StatusBadge status={j.status} /></td>
                  <td className="num cell-strong">{eur(jobTotal(j))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
