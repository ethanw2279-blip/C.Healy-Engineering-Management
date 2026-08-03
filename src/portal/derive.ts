import type { PortalState } from './PortalData'
import type { PortalView } from './PortalNav'
import { invoiceTotal, quoteTotal } from '../data/store'
import { registerStatus } from '../data/ga1'

// Derived, screen-agnostic selectors over the client's own data. Kept here so
// the shell (badges, search, notifications) and screens agree on definitions.

const today = () => new Date()
const daysUntil = (dateStr: string) => {
  if (!dateStr) return Infinity
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return Infinity
  return Math.round((d.getTime() - today().getTime()) / 86400000)
}

export const awaitingQuotes = (s: PortalState) => s.quotes.filter((q) => q.status === 'Awaiting response')

export const openInvoices = (s: PortalState) =>
  s.invoices.filter((i) => i.status !== 'Paid' && i.status !== 'Draft')

export const pastDueInvoices = (s: PortalState) =>
  s.invoices.filter((i) => i.status !== 'Paid' && i.status !== 'Draft' && daysUntil(i.dueOn) < 0)

export const outstandingTotal = (s: PortalState) =>
  openInvoices(s).reduce((sum, i) => sum + invoiceTotal(i), 0)

export const activeJobs = (s: PortalState) => s.jobs.filter((j) => j.status !== 'Complete')

// GA1 assets that need attention: not "safe", or the next exam is overdue /
// falling due within 60 days.
export const ga1Attention = (s: PortalState) =>
  s.ga1.filter((g) => g.overallResult !== 'safe' || daysUntil(g.nextExaminationDate) <= 60)

export type SearchHit = { kind: string; label: string; view: PortalView; id: string }

export function searchAll(s: PortalState, q: string): SearchHit[] {
  const term = q.trim().toLowerCase()
  if (!term) return []
  const hits: SearchHit[] = []
  const match = (t: string) => t.toLowerCase().includes(term)
  for (const x of s.quotes) if (match(x.number) || match(x.title)) hits.push({ kind: 'Quote', label: `${x.number} · ${x.title}`, view: 'quote', id: x.id })
  for (const x of s.jobs) if (match(x.number) || match(x.title)) hits.push({ kind: 'Job', label: `${x.number} · ${x.title}`, view: 'job', id: x.id })
  for (const x of s.invoices) if (match(x.number)) hits.push({ kind: 'Invoice', label: x.number, view: 'invoice', id: x.id })
  for (const x of s.ga1) if (match(x.reportNumber) || match(x.serialNumber) || match(x.equipmentType)) hits.push({ kind: 'GA1', label: `${x.reportNumber} · ${x.equipmentType || x.serialNumber}`, view: 'equipment', id: x.id })
  return hits.slice(0, 8)
}

export type PortalNotice = { id: string; title: string; meta: string; view: PortalView; targetId?: string }

export function buildNotifications(s: PortalState): PortalNotice[] {
  const out: PortalNotice[] = []
  for (const q of awaitingQuotes(s)) {
    out.push({ id: `q-${q.id}`, title: `Quote ${q.number} awaiting your approval`, meta: `${q.title} · €${quoteTotal(q).toFixed(0)}`, view: 'quote', targetId: q.id })
  }
  for (const i of pastDueInvoices(s)) {
    out.push({ id: `i-${i.id}`, title: `Invoice ${i.number} is past due`, meta: `${Math.abs(daysUntil(i.dueOn))} days · €${invoiceTotal(i).toFixed(0)}`, view: 'invoice', targetId: i.id })
  }
  for (const g of ga1Attention(s)) {
    const dd = daysUntil(g.nextExaminationDate)
    const meta = dd < 0 ? `Overdue · ${registerStatus(g)}` : `Due in ${dd} days · ${registerStatus(g)}`
    out.push({ id: `g-${g.id}`, title: `${g.equipmentType || g.serialNumber || 'Asset'} — ${g.reportNumber}`, meta, view: 'equipment', targetId: g.id })
  }
  return out
}

export { daysUntil }
