import { useNavigate } from 'react-router-dom'
import { PageHeader, Button, StatusBadge, EmptyState, Avatar } from '../components/ui'
import { TrashIcon } from '../../components/Icons'
import { useStore, useCurrentUser, formatDate } from '../../data/store'
import { useCreate } from '../useCreate'
import type { Request } from '../../data/types'

export default function Requests() {
  const { state, dispatch } = useStore()
  const { can } = useCurrentUser()
  const create = useCreate()
  const nav = useNavigate()
  const clientById = (id: string) => state.clients.find((c) => c.id === id)?.name ?? 'Unknown'
  const canManage = can('create:records')

  const remove = (e: React.MouseEvent, r: Request) => {
    e.stopPropagation()
    if (confirm('Remove this request?')) dispatch({ type: 'REMOVE_REQUEST', id: r.id })
  }

  return (
    <div>
      <PageHeader
        title="Requests"
        subtitle={`${state.requests.length} incoming`}
        action={canManage && <Button onClick={() => create('request')}>New request</Button>}
      />

      <div className="card">
        {state.requests.length === 0 ? (
          <EmptyState title="No requests" hint="New client enquiries will appear here." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Client</th>
                <th>Service</th>
                <th>Requested</th>
                <th>Status</th>
                {canManage && <th />}
              </tr>
            </thead>
            <tbody>
              {state.requests.map((r) => (
                <tr key={r.id} className="clickable" onClick={() => nav(`/requests/${r.id}`)}>
                  <td className="cell-strong">{r.title}</td>
                  <td>
                    <div className="cell-with-avatar">
                      <Avatar name={clientById(r.clientId)} size={28} />
                      {clientById(r.clientId)}
                    </div>
                  </td>
                  <td className="cell-muted">{r.service}</td>
                  <td className="cell-muted">{formatDate(r.requestedOn)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  {canManage && (
                    <td className="num">
                      <button className="row-remove" aria-label="Remove request" onClick={(e) => remove(e, r)}>
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

      <p className="table-hint">Tip: click a request to view it and convert it into a quote.</p>
    </div>
  )
}
