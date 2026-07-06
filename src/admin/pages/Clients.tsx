import { useState } from 'react'
import { PageHeader, Button, StatusBadge, Avatar, EmptyState } from '../components/ui'
import { useStore, formatDate } from '../../data/store'
import { useCreate } from '../useCreate'

const filters = ['All', 'Lead', 'Active', 'Archived'] as const

export default function Clients() {
  const { state } = useStore()
  const create = useCreate()
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')

  const rows = state.clients.filter((c) => filter === 'All' || c.status === filter)

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${state.clients.length} total`}
        action={<Button onClick={() => create('client')}>New client</Button>}
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
          <EmptyState title="No clients here" hint="Create a client to get started." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Status</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="cell-with-avatar">
                      <Avatar name={c.name} size={32} />
                      <div className="stack-tight">
                        <span className="cell-strong">{c.name}</span>
                        {c.company && <span className="cell-muted">{c.company}</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="stack-tight">
                      <span>{c.email}</span>
                      <span className="cell-muted">{c.phone}</span>
                    </div>
                  </td>
                  <td className="cell-muted">{c.address}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="cell-muted">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
