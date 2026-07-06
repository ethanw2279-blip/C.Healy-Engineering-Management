import { PageHeader, Button, StatusBadge, EmptyState, Avatar } from '../components/ui'
import { useStore, useCurrentUser, formatDate } from '../../data/store'
import { useCreate } from '../useCreate'

export default function Requests() {
  const { state } = useStore()
  const { can } = useCurrentUser()
  const create = useCreate()
  const clientById = (id: string) => state.clients.find((c) => c.id === id)?.name ?? 'Unknown'

  return (
    <div>
      <PageHeader
        title="Requests"
        subtitle={`${state.requests.length} incoming`}
        action={can('create:records') && <Button onClick={() => create('request')}>New request</Button>}
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
              </tr>
            </thead>
            <tbody>
              {state.requests.map((r) => (
                <tr key={r.id}>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
