import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, Button, StatusBadge, EmptyState } from '../components/ui'
import { TrashIcon } from '../../components/Icons'
import { useStore, useCurrentUser, eur, invoiceTotal, formatDate } from '../../data/store'
import { useCreate } from '../useCreate'
import type { Invoice } from '../../data/types'

const filters = ['All', 'Draft', 'Awaiting payment', 'Past due', 'Paid'] as const

export default function Invoices() {
  const { state, dispatch } = useStore()
  const { can } = useCurrentUser()
  const create = useCreate()
  const nav = useNavigate()
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')

  const clientById = (id: string) => state.clients.find((c) => c.id === id)?.name ?? 'Unknown'
  const rows = state.invoices.filter((i) => filter === 'All' || i.status === filter)
  const outstanding = state.invoices
    .filter((i) => i.status !== 'Paid')
    .reduce((s, i) => s + invoiceTotal(i), 0)
  const canManage = can('create:records')

  const remove = (e: React.MouseEvent, i: Invoice) => {
    e.stopPropagation()
    if (confirm(`Remove ${i.number}?`)) dispatch({ type: 'REMOVE_INVOICE', id: i.id })
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle={`${eur(outstanding)} outstanding`}
        action={can('create:records') && <Button onClick={() => create('invoice')}>New invoice</Button>}
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
          <EmptyState title="No invoices" hint="Invoice a completed job to get paid." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Status</th>
                <th className="num">Amount</th>
                {canManage && <th />}
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id} className="clickable" onClick={() => nav(`/invoices/${i.id}`)}>
                  <td className="cell-strong">{i.number}</td>
                  <td>{clientById(i.clientId)}</td>
                  <td className="cell-muted">{formatDate(i.issuedOn)}</td>
                  <td className="cell-muted">{formatDate(i.dueOn)}</td>
                  <td><StatusBadge status={i.status} /></td>
                  <td className="num cell-strong">{eur(invoiceTotal(i))}</td>
                  {canManage && (
                    <td className="num">
                      <button className="row-remove" aria-label={`Remove ${i.number}`} onClick={(e) => remove(e, i)}>
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
    </div>
  )
}
