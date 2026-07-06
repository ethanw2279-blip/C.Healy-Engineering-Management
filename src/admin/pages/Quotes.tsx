import { useState } from 'react'
import { PageHeader, Button, StatusBadge, EmptyState } from '../components/ui'
import { useStore, useCurrentUser, eur, quoteTotal, formatDate } from '../../data/store'
import { useCreate } from '../useCreate'

const filters = ['All', 'Draft', 'Awaiting response', 'Approved', 'Converted'] as const

export default function Quotes() {
  const { state } = useStore()
  const { can } = useCurrentUser()
  const create = useCreate()
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')

  const clientById = (id: string) => state.clients.find((c) => c.id === id)?.name ?? 'Unknown'
  const rows = state.quotes.filter((q) => filter === 'All' || q.status === filter)
  const total = rows.reduce((s, q) => s + quoteTotal(q), 0)

  return (
    <div>
      <PageHeader
        title="Quotes"
        subtitle={`${rows.length} quotes · ${eur(total)} total`}
        action={can('create:records') && <Button onClick={() => create('quote')}>New quote</Button>}
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
          <EmptyState title="No quotes yet" hint="Create a quote to send to a client." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Quote</th>
                <th>Client</th>
                <th>Created</th>
                <th>Status</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => (
                <tr key={q.id}>
                  <td>
                    <div className="stack-tight">
                      <span className="cell-strong">{q.number}</span>
                      <span className="cell-muted">{q.title}</span>
                    </div>
                  </td>
                  <td>{clientById(q.clientId)}</td>
                  <td className="cell-muted">{formatDate(q.createdAt)}</td>
                  <td><StatusBadge status={q.status} /></td>
                  <td className="num cell-strong">{eur(quoteTotal(q))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
