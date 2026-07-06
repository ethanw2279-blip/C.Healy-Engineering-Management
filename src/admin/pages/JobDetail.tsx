import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button, StatusBadge, Avatar, EmptyState } from '../components/ui'
import JobModal from '../JobModal'
import { nextNumber, today } from '../formParts'
import {
  useStore,
  useCurrentUser,
  newId,
  eur,
  eurExact,
  jobTotal,
  invoiceTotal,
  formatDate,
} from '../../data/store'
import type { Invoice } from '../../data/types'

export default function JobDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { state, dispatch } = useStore()
  const { can } = useCurrentUser()
  const [editing, setEditing] = useState(false)

  const job = state.jobs.find((j) => j.id === id)
  if (!job) {
    return (
      <div>
        <Link className="back-link" to="/jobs">← Jobs</Link>
        <div className="card"><EmptyState title="Job not found" hint="It may have been removed." /></div>
      </div>
    )
  }

  const canManage = can('create:records')
  const client = state.clients.find((c) => c.id === job.clientId)
  const crew = job.assignedTo
    .map((eid) => state.employees.find((e) => e.id === eid))
    .filter(Boolean) as { id: string; name: string; color: string }[]
  const visits = state.visits.filter((v) => v.jobId === job.id).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
  const entries = state.timeEntries.filter((t) => t.jobId === job.id)
  const hoursLogged = entries.reduce((s, t) => s + t.hours, 0)
  const invoices = state.invoices.filter((i) => i.jobId === job.id)

  const remove = () => {
    if (confirm(`Remove ${job.number}? This can't be undone.`)) {
      dispatch({ type: 'REMOVE_JOB', id: job.id })
      nav('/jobs')
    }
  }

  // Job → Invoice: copy the job's line items into a new draft invoice due in
  // two weeks, and mark the job as requiring invoicing → invoiced.
  const convertToInvoice = () => {
    const due = new Date()
    due.setDate(due.getDate() + 14)
    const invoice: Invoice = {
      id: newId('i'),
      number: nextNumber('INV-', state.invoices.map((i) => i.number)),
      clientId: job.clientId,
      jobId: job.id,
      items: job.items.map((it) => ({ ...it, id: newId('li') })),
      status: 'Draft',
      issuedOn: today(),
      dueOn: `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`,
    }
    dispatch({ type: 'ADD_INVOICE', invoice })
    nav(`/invoices/${invoice.id}`)
  }

  return (
    <div>
      <Link className="back-link" to="/jobs">← Jobs</Link>

      <div className="detail-head">
        <div className="detail-id">
          <div>
            <h1 className="detail-name">{job.number} · {job.title}</h1>
            <div className="detail-sub">
              {client && <Link className="link" to={`/clients/${client.id}`}>{client.name}</Link>}
              <StatusBadge status={job.status} />
            </div>
          </div>
        </div>
        {canManage && (
          <div className="detail-actions">
            <Button onClick={convertToInvoice}>Create invoice</Button>
            <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="danger" onClick={remove}>Remove</Button>
          </div>
        )}
      </div>

      <div className="detail-grid">
        <div className="card contact-card">
          <div className="contact-row"><span>Client</span><strong>{client?.name ?? '—'}</strong></div>
          <div className="contact-row"><span>Scheduled</span><strong>{job.startDate ? formatDate(job.startDate) : 'Unscheduled'}</strong></div>
          <div className="contact-row"><span>Ends</span><strong>{job.endDate ? formatDate(job.endDate) : '—'}</strong></div>
          <div className="contact-row"><span>Address</span><strong>{client?.address ?? '—'}</strong></div>
        </div>

        <div className="stat-grid detail-stats">
          <div className="stat-card">
            <div className="stat-label">Job value</div>
            <div className="stat-value">{eur(jobTotal(job))}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Hours logged</div>
            <div className="stat-value">{hoursLogged}h</div>
            <div className="stat-meta">{entries.length} entr{entries.length === 1 ? 'y' : 'ies'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Visits</div>
            <div className="stat-value">{visits.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Team</div>
            <div className="stat-value">{crew.length}</div>
          </div>
        </div>
      </div>

      {/* Assigned team */}
      <Section title="Assigned team">
        {crew.length === 0 ? (
          <EmptyState title="No one assigned" hint={canManage ? 'Edit the job to assign crew.' : undefined} />
        ) : (
          <div className="crew-list">
            {crew.map((e) => (
              <div key={e.id} className="crew-chip">
                <Avatar name={e.name} color={e.color} size={30} />
                <span>{e.name}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Line items */}
      <Section title="Line items">
        <table className="table">
          <thead><tr><th>Product / service</th><th className="num">Qty</th><th className="num">Unit</th><th className="num">Total</th></tr></thead>
          <tbody>
            {job.items.length === 0 && <tr><td colSpan={4} className="cell-muted">No line items.</td></tr>}
            {job.items.map((it) => (
              <tr key={it.id}>
                <td className="cell-strong">{it.name}</td>
                <td className="num">{it.qty}</td>
                <td className="num">{eurExact(it.unitPrice)}</td>
                <td className="num cell-strong">{eurExact(it.qty * it.unitPrice)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={3} className="num cell-strong">Total</td>
              <td className="num cell-strong">{eur(jobTotal(job))}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Visits */}
      <Section title={`Visits (${visits.length})`}>
        {visits.length === 0 ? (
          <EmptyState title="No visits scheduled" />
        ) : (
          <table className="table">
            <thead><tr><th>Date</th><th>Time</th><th>Assigned</th></tr></thead>
            <tbody>
              {visits.map((v) => {
                const e = state.employees.find((x) => x.id === v.employeeId)
                return (
                  <tr key={v.id}>
                    <td className="cell-strong">{formatDate(v.date)}</td>
                    <td className="cell-muted">{v.start} – {v.end}</td>
                    <td>{e && <div className="cell-with-avatar"><Avatar name={e.name} color={e.color} size={24} />{e.name}</div>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Section>

      {/* Time entries */}
      <Section title={`Logged hours (${hoursLogged}h)`}>
        {entries.length === 0 ? (
          <EmptyState title="No time logged yet" />
        ) : (
          <table className="table">
            <thead><tr><th>Date</th><th>Employee</th><th>Note</th><th className="num">Hours</th><th>Status</th></tr></thead>
            <tbody>
              {entries.map((t) => {
                const e = state.employees.find((x) => x.id === t.employeeId)
                return (
                  <tr key={t.id}>
                    <td className="cell-muted">{formatDate(t.date)}</td>
                    <td>{e && <div className="cell-with-avatar"><Avatar name={e.name} color={e.color} size={24} />{e.name}</div>}</td>
                    <td className="cell-muted">{t.note ?? '—'}</td>
                    <td className="num cell-strong">{t.hours}h</td>
                    <td><StatusBadge status={t.approved ? 'Approved' : 'Pending'} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Section>

      {invoices.length > 0 && (
        <Section title={`Invoices (${invoices.length})`}>
          <table className="table">
            <thead><tr><th>Invoice</th><th>Issued</th><th>Status</th><th className="num">Amount</th></tr></thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id}>
                  <td className="cell-strong">{i.number}</td>
                  <td className="cell-muted">{formatDate(i.issuedOn)}</td>
                  <td><StatusBadge status={i.status} /></td>
                  <td className="num cell-strong">{eur(invoiceTotal(i))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {editing && <JobModal editing={job} onClose={() => setEditing(false)} />}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="detail-section">
      <div className="detail-section-title">{title}</div>
      <div className="card">{children}</div>
    </div>
  )
}
