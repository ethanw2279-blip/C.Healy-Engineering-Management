import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button, StatusBadge, Avatar, EmptyState } from '../components/ui'
import ClientModal from '../ClientModal'
import Notes from '../components/Notes'
import Attachments from '../components/Attachments'
import {
  useStore,
  useCurrentUser,
  eur,
  jobTotal,
  quoteTotal,
  invoiceTotal,
  formatDate,
  formatDateShort,
} from '../../data/store'
import { GA1_EXAM_TYPE, ga1Description, registerStatus } from '../../data/ga1'
import { downloadRegisterCsv, downloadRegisterPdf, emailReportsToClient, downloadGA1Zip } from '../../data/ga1Export'

export default function ClientDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { state, dispatch } = useStore()
  const { can } = useCurrentUser()
  const [editing, setEditing] = useState(false)
  const [ga1Busy, setGa1Busy] = useState<null | 'email' | 'pdf' | 'zip'>(null)
  const [ga1Msg, setGa1Msg] = useState<string | null>(null)
  const [ga1Selected, setGa1Selected] = useState<Set<string>>(new Set())

  const client = state.clients.find((c) => c.id === id)
  if (!client) {
    return (
      <div>
        <Link className="back-link" to="/clients">← Clients</Link>
        <div className="card"><EmptyState title="Client not found" hint="It may have been removed." /></div>
      </div>
    )
  }

  const canManage = can('create:records')
  const jobs = state.jobs.filter((j) => j.clientId === client.id)
  const quotes = state.quotes.filter((q) => q.clientId === client.id)
  const invoices = state.invoices.filter((i) => i.clientId === client.id)
  const requests = state.requests.filter((r) => r.clientId === client.id)

  const ga1 = state.ga1.filter((g) => g.clientId === client.id)
  const registerName = client.company || client.name

  const emailReports = async () => {
    setGa1Msg(null)
    setGa1Busy('email')
    try {
      const { sentTo, reportCount } = await emailReportsToClient(client.id)
      setGa1Msg(`Sent a portal link for ${reportCount} report${reportCount === 1 ? '' : 's'} to ${sentTo}.`)
    } catch (e) {
      setGa1Msg(e instanceof Error ? e.message : 'Could not send the email.')
    } finally {
      setGa1Busy(null)
    }
  }
  const registerCsv = () => {
    setGa1Msg(null)
    downloadRegisterCsv(ga1, registerName, formatDate)
  }
  const registerPdf = async () => {
    setGa1Msg(null)
    setGa1Busy('pdf')
    try {
      await downloadRegisterPdf(registerName, client.id)
    } catch (e) {
      setGa1Msg(e instanceof Error ? e.message : 'Could not download the register.')
    } finally {
      setGa1Busy(null)
    }
  }
  const toggleGa1 = (id: string) => setGa1Selected((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const toggleGa1All = () => setGa1Selected((prev) => (prev.size === ga1.length ? new Set() : new Set(ga1.map((g) => g.id))))
  const downloadZip = async () => {
    setGa1Msg(null)
    setGa1Busy('zip')
    try {
      await downloadGA1Zip([...ga1Selected], registerName)
    } catch (e) {
      setGa1Msg(e instanceof Error ? e.message : 'Could not download the zip.')
    } finally {
      setGa1Busy(null)
    }
  }

  const currentJobs = jobs.filter((j) => j.status !== 'Complete')
  const pastJobs = jobs.filter((j) => j.status === 'Complete')
  const revenue = invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + invoiceTotal(i), 0)
  const outstanding = invoices.filter((i) => i.status !== 'Paid').reduce((s, i) => s + invoiceTotal(i), 0)
  const lifetimeValue = jobs.reduce((s, j) => s + jobTotal(j), 0)

  const remove = () => {
    if (confirm(`Remove ${client.name}? This can't be undone.`)) {
      dispatch({ type: 'REMOVE_CLIENT', id: client.id })
      nav('/clients')
    }
  }

  const empName = (ids: string[]) =>
    ids.map((eid) => state.employees.find((e) => e.id === eid)).filter(Boolean) as { name: string; color: string }[]

  return (
    <div>
      <Link className="back-link" to="/clients">← Clients</Link>

      <div className="detail-head">
        <div className="detail-id">
          <Avatar name={client.name} size={56} />
          <div>
            <h1 className="detail-name">{client.name}</h1>
            <div className="detail-sub">
              {client.company && <span>{client.company}</span>}
              <StatusBadge status={client.status} />
            </div>
          </div>
        </div>
        {canManage && (
          <div className="detail-actions">
            <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="danger" onClick={remove}>Remove</Button>
          </div>
        )}
      </div>

      {/* Contact + KPIs */}
      <div className="detail-grid">
        <div className="card contact-card">
          <div className="contact-row"><span>Email</span><strong>{client.email || '—'}</strong></div>
          <div className="contact-row"><span>Phone</span><strong>{client.phone || '—'}</strong></div>
          <div className="contact-row"><span>Address</span><strong>{client.address || '—'}</strong></div>
          <div className="contact-row"><span>Client since</span><strong>{formatDate(client.createdAt)}</strong></div>
        </div>

        <div className="stat-grid detail-stats">
          <div className="stat-card">
            <div className="stat-label">Revenue (paid)</div>
            <div className="stat-value">{eur(revenue)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Outstanding</div>
            <div className="stat-value">{eur(outstanding)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Lifetime job value</div>
            <div className="stat-value">{eur(lifetimeValue)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Jobs</div>
            <div className="stat-value">{jobs.length}</div>
            <div className="stat-meta">{currentJobs.length} active</div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <Section title="Notes">
        <Notes entityType="client" entityId={client.id} />
      </Section>

      {/* Attachments */}
      <Section title="Files">
        <Attachments entityType="client" entityId={client.id} />
      </Section>

      {/* Current jobs */}
      <Section title={`Current jobs (${currentJobs.length})`}>
        {currentJobs.length === 0 ? (
          <EmptyState title="No open jobs" />
        ) : (
          <table className="table">
            <thead><tr><th>Job</th><th>Schedule</th><th>Team</th><th>Status</th><th className="num">Value</th></tr></thead>
            <tbody>
              {currentJobs.map((j) => (
                <tr key={j.id}>
                  <td><div className="stack-tight"><span className="cell-strong">{j.number}</span><span className="cell-muted">{j.title}</span></div></td>
                  <td className="cell-muted">{j.startDate ? formatDateShort(j.startDate) : 'Unscheduled'}</td>
                  <td><div className="cell-with-avatar">{empName(j.assignedTo).map((e, i) => <Avatar key={i} name={e.name} color={e.color} size={24} />)}{j.assignedTo.length === 0 && <span className="cell-muted">—</span>}</div></td>
                  <td><StatusBadge status={j.status} /></td>
                  <td className="num cell-strong">{eur(jobTotal(j))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Job history */}
      <Section title={`Job history (${pastJobs.length})`}>
        {pastJobs.length === 0 ? (
          <EmptyState title="No completed jobs yet" />
        ) : (
          <table className="table">
            <thead><tr><th>Job</th><th>Completed</th><th>Team</th><th className="num">Value</th></tr></thead>
            <tbody>
              {pastJobs.map((j) => (
                <tr key={j.id}>
                  <td><div className="stack-tight"><span className="cell-strong">{j.number}</span><span className="cell-muted">{j.title}</span></div></td>
                  <td className="cell-muted">{formatDateShort(j.endDate || j.startDate)}</td>
                  <td><div className="cell-with-avatar">{empName(j.assignedTo).map((e, i) => <Avatar key={i} name={e.name} color={e.color} size={24} />)}</div></td>
                  <td className="num cell-strong">{eur(jobTotal(j))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Quotes */}
      <Section title={`Quotes (${quotes.length})`}>
        {quotes.length === 0 ? (
          <EmptyState title="No quotes" />
        ) : (
          <table className="table">
            <thead><tr><th>Quote</th><th>Created</th><th>Status</th><th className="num">Total</th></tr></thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td><div className="stack-tight"><span className="cell-strong">{q.number}</span><span className="cell-muted">{q.title}</span></div></td>
                  <td className="cell-muted">{formatDate(q.createdAt)}</td>
                  <td><StatusBadge status={q.status} /></td>
                  <td className="num cell-strong">{eur(quoteTotal(q))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Invoices */}
      <Section title={`Invoices (${invoices.length})`}>
        {invoices.length === 0 ? (
          <EmptyState title="No invoices" />
        ) : (
          <table className="table">
            <thead><tr><th>Invoice</th><th>Issued</th><th>Due</th><th>Status</th><th className="num">Amount</th></tr></thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id}>
                  <td className="cell-strong">{i.number}</td>
                  <td className="cell-muted">{formatDate(i.issuedOn)}</td>
                  <td className="cell-muted">{formatDate(i.dueOn)}</td>
                  <td><StatusBadge status={i.status} /></td>
                  <td className="num cell-strong">{eur(invoiceTotal(i))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* GA1 reports + register */}
      <Section title={`GA1 reports (${ga1.length})`}>
        {canManage && (
          <div className="ga1-register-bar">
            <Button variant="secondary" size="sm" onClick={emailReports} disabled={ga1Busy !== null || !client.email}>
              {ga1Busy === 'email' ? 'Sending…' : 'Email reports to client'}
            </Button>
            <Button variant="secondary" size="sm" onClick={registerPdf} disabled={ga1Busy !== null || ga1.length === 0}>
              {ga1Busy === 'pdf' ? 'Preparing…' : 'Download register (PDF)'}
            </Button>
            <Button variant="secondary" size="sm" onClick={registerCsv} disabled={ga1.length === 0}>
              Download register (CSV)
            </Button>
            <Button variant="secondary" size="sm" onClick={downloadZip} disabled={ga1Busy !== null || ga1Selected.size === 0}>
              {ga1Busy === 'zip' ? 'Zipping…' : `Download selected (ZIP)${ga1Selected.size ? ` · ${ga1Selected.size}` : ''}`}
            </Button>
            {!client.email && <span className="cell-muted">Add an email address to send reports.</span>}
          </div>
        )}
        {ga1Msg && <div className="ga1-register-msg">{ga1Msg}</div>}
        {ga1.length === 0 ? (
          <EmptyState title="No GA1 reports" />
        ) : (
          <table className="table">
            <thead><tr>
              {canManage && <th style={{ width: 32 }}><input type="checkbox" aria-label="Select all GA1 reports" checked={ga1Selected.size === ga1.length && ga1.length > 0} onChange={toggleGa1All} /></th>}
              <th>Exam Type</th><th>Serial No.</th><th>Description</th><th>Exam Date</th><th>Next Exam</th><th>Status</th><th>Cert No.</th>
            </tr></thead>
            <tbody>
              {ga1.map((g) => (
                <tr key={g.id} className="clickable" onClick={() => nav(`/ga1/${g.id}`)}>
                  {canManage && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" aria-label={`Select ${g.reportNumber}`} checked={ga1Selected.has(g.id)} onChange={() => toggleGa1(g.id)} />
                    </td>
                  )}
                  <td className="cell-muted">{GA1_EXAM_TYPE}</td>
                  <td>{g.serialNumber || '—'}</td>
                  <td className="cell-muted">{ga1Description(g)}</td>
                  <td className="cell-muted">{formatDate(g.examinationDate)}</td>
                  <td className="cell-muted">{formatDate(g.nextExaminationDate)}</td>
                  <td><StatusBadge status={registerStatus(g)} /></td>
                  <td className="cell-strong">{g.reportNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {requests.length > 0 && (
        <Section title={`Requests (${requests.length})`}>
          <table className="table">
            <thead><tr><th>Request</th><th>Service</th><th>Requested</th><th>Status</th></tr></thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="cell-strong">{r.title}</td>
                  <td className="cell-muted">{r.service}</td>
                  <td className="cell-muted">{formatDate(r.requestedOn)}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {editing && <ClientModal editing={client} onClose={() => setEditing(false)} />}
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
