import { supabase } from '../lib/supabaseClient'
import type { State } from './types'
import type { Action } from './store'

// ============================================================================
// Supabase data-access layer.
//
// loadState() reads every table (RLS filters to what the signed-in user may
// see) and assembles the same `State` shape the app already uses.
//
// persist() write-throughs a single dispatched Action to the database. The
// reducer still updates local state optimistically, so the UI stays instant.
// ============================================================================

const num = (v: unknown) => Number(v ?? 0)

// ---- Row → app-model mappers ----------------------------------------------
type Row = Record<string, any>

const mapItems = (rows: Row[]) =>
  rows.map((r) => ({ id: r.id, name: r.name, qty: num(r.qty), unitPrice: num(r.unit_price) }))

export async function loadState(): Promise<State> {
  const [
    { data: roles }, { data: employees }, { data: clients }, { data: requests },
    { data: quotes }, { data: quoteItems }, { data: jobs }, { data: jobItems },
    { data: jobAssignees }, { data: invoices }, { data: invoiceItems },
    { data: timeEntries }, { data: visits }, { data: notes },
  ] = await Promise.all([
    supabase.from('roles').select('*'),
    supabase.from('employees').select('*'),
    supabase.from('clients').select('*').order('created_at', { ascending: false }),
    supabase.from('requests').select('*'),
    supabase.from('quotes').select('*').order('created_at', { ascending: false }),
    supabase.from('quote_items').select('*'),
    supabase.from('jobs').select('*'),
    supabase.from('job_items').select('*'),
    supabase.from('job_assignees').select('*'),
    supabase.from('invoices').select('*'),
    supabase.from('invoice_items').select('*'),
    supabase.from('time_entries').select('*'),
    supabase.from('visits').select('*'),
    supabase.from('notes').select('*').order('created_at', { ascending: false }),
  ])

  const itemsFor = (rows: Row[] | null, key: string, id: string) =>
    mapItems((rows ?? []).filter((r) => r[key] === id))

  const { data: auth } = await supabase.auth.getUser()
  const me = (employees ?? []).find((e: Row) => e.auth_user_id === auth.user?.id)

  return {
    currentUserId: me?.id ?? '',
    roles: (roles ?? []).map((r: Row) => ({
      id: r.id, name: r.name, description: r.description, permissions: r.permissions ?? [], system: r.system,
    })),
    employees: (employees ?? []).map((e: Row) => ({
      id: e.id, name: e.name, roleId: e.role_id, email: e.email, phone: e.phone,
      hourlyRate: num(e.hourly_rate), color: e.color, active: e.active,
    })),
    clients: (clients ?? []).map((c: Row) => ({
      id: c.id, name: c.name, company: c.company ?? undefined, email: c.email,
      phone: c.phone, address: c.address, status: c.status, createdAt: c.created_at,
    })),
    requests: (requests ?? []).map((r: Row) => ({
      id: r.id, clientId: r.client_id, title: r.title, service: r.service,
      requestedOn: r.requested_on, status: r.status,
    })),
    quotes: (quotes ?? []).map((q: Row) => ({
      id: q.id, number: q.number, clientId: q.client_id, title: q.title,
      status: q.status, createdAt: q.created_at, items: itemsFor(quoteItems, 'quote_id', q.id),
    })),
    jobs: (jobs ?? []).map((j: Row) => ({
      id: j.id, number: j.number, clientId: j.client_id, title: j.title, status: j.status,
      startDate: j.start_date ?? '', endDate: j.end_date ?? '',
      items: itemsFor(jobItems, 'job_id', j.id),
      assignedTo: (jobAssignees ?? []).filter((a: Row) => a.job_id === j.id).map((a: Row) => a.employee_id),
    })),
    invoices: (invoices ?? []).map((i: Row) => ({
      id: i.id, number: i.number, clientId: i.client_id, jobId: i.job_id ?? undefined,
      status: i.status, issuedOn: i.issued_on, dueOn: i.due_on,
      items: itemsFor(invoiceItems, 'invoice_id', i.id),
    })),
    timeEntries: (timeEntries ?? []).map((t: Row) => ({
      id: t.id, employeeId: t.employee_id, jobId: t.job_id ?? undefined, date: t.date,
      hours: num(t.hours), note: t.note ?? undefined, approved: t.approved,
    })),
    visits: (visits ?? []).map((v: Row) => ({
      id: v.id, jobId: v.job_id, employeeId: v.employee_id, date: v.date, start: v.start_time, end: v.end_time,
    })),
    notes: (notes ?? []).map((n: Row) => ({
      id: n.id, entityType: n.entity_type, entityId: n.entity_id, body: n.body,
      authorId: n.author_id, createdAt: n.created_at,
    })),
  }
}

// ---- App-model → row mappers (for writes) ---------------------------------
const clientRow = (c: State['clients'][number]) => ({
  id: c.id, name: c.name, company: c.company ?? null, email: c.email,
  phone: c.phone, address: c.address, status: c.status, created_at: c.createdAt,
})
const itemRows = (parentKey: string, parentId: string, items: { id: string; name: string; qty: number; unitPrice: number }[]) =>
  items.map((it) => ({ id: it.id, [parentKey]: parentId, name: it.name, qty: it.qty, unit_price: it.unitPrice }))

async function check<T>(p: PromiseLike<{ error: T | null }>) {
  const { error } = await p
  if (error) throw error
}

// ---- Persist a single dispatched action -----------------------------------
export async function persist(action: Action): Promise<void> {
  switch (action.type) {
    case 'ADD_CLIENT':
    case 'UPDATE_CLIENT':
      return check(supabase.from('clients').upsert(clientRow(action.client)))
    case 'REMOVE_CLIENT':
      return check(supabase.from('clients').delete().eq('id', action.id))

    case 'ADD_REQUEST':
    case 'UPDATE_REQUEST': {
      const r = action.request
      return check(supabase.from('requests').upsert({
        id: r.id, client_id: r.clientId, title: r.title, service: r.service,
        requested_on: r.requestedOn, status: r.status,
      }))
    }
    case 'REMOVE_REQUEST':
      return check(supabase.from('requests').delete().eq('id', action.id))

    case 'ADD_QUOTE':
    case 'UPDATE_QUOTE': {
      const q = action.quote
      await check(supabase.from('quotes').upsert({
        id: q.id, number: q.number, client_id: q.clientId, title: q.title, status: q.status, created_at: q.createdAt,
      }))
      await check(supabase.from('quote_items').delete().eq('quote_id', q.id))
      if (q.items.length) await check(supabase.from('quote_items').insert(itemRows('quote_id', q.id, q.items)))
      return
    }
    case 'REMOVE_QUOTE':
      return check(supabase.from('quotes').delete().eq('id', action.id))

    case 'ADD_JOB':
    case 'UPDATE_JOB': {
      const j = action.job
      await check(supabase.from('jobs').upsert({
        id: j.id, number: j.number, client_id: j.clientId, title: j.title, status: j.status,
        start_date: j.startDate || null, end_date: j.endDate || null,
      }))
      await check(supabase.from('job_items').delete().eq('job_id', j.id))
      if (j.items.length) await check(supabase.from('job_items').insert(itemRows('job_id', j.id, j.items)))
      await check(supabase.from('job_assignees').delete().eq('job_id', j.id))
      if (j.assignedTo.length)
        await check(supabase.from('job_assignees').insert(j.assignedTo.map((eid) => ({ job_id: j.id, employee_id: eid }))))
      return
    }
    case 'REMOVE_JOB':
      return check(supabase.from('jobs').delete().eq('id', action.id))

    case 'ADD_INVOICE':
    case 'UPDATE_INVOICE': {
      const i = action.invoice
      await check(supabase.from('invoices').upsert({
        id: i.id, number: i.number, client_id: i.clientId, job_id: i.jobId ?? null,
        status: i.status, issued_on: i.issuedOn, due_on: i.dueOn,
      }))
      await check(supabase.from('invoice_items').delete().eq('invoice_id', i.id))
      if (i.items.length) await check(supabase.from('invoice_items').insert(itemRows('invoice_id', i.id, i.items)))
      return
    }
    case 'REMOVE_INVOICE':
      return check(supabase.from('invoices').delete().eq('id', action.id))

    case 'ADD_EMPLOYEE':
    case 'UPDATE_EMPLOYEE': {
      const e = action.employee
      return check(supabase.from('employees').upsert({
        id: e.id, name: e.name, role_id: e.roleId, email: e.email, phone: e.phone,
        hourly_rate: e.hourlyRate, color: e.color, active: e.active,
      }))
    }
    case 'REMOVE_EMPLOYEE':
      return check(supabase.from('employees').delete().eq('id', action.id))

    case 'ADD_ROLE':
    case 'UPDATE_ROLE': {
      const r = action.role
      return check(supabase.from('roles').upsert({
        id: r.id, name: r.name, description: r.description, permissions: r.permissions, system: r.system ?? false,
      }))
    }
    case 'DELETE_ROLE':
      return check(supabase.from('roles').delete().eq('id', action.id))

    case 'ADD_TIME_ENTRY': {
      const t = action.entry
      return check(supabase.from('time_entries').insert({
        id: t.id, employee_id: t.employeeId, job_id: t.jobId ?? null, date: t.date,
        hours: t.hours, note: t.note ?? null, approved: t.approved,
      }))
    }
    case 'APPROVE_TIME':
      return check(supabase.from('time_entries').update({ approved: true }).eq('id', action.id))
    case 'APPROVE_ALL_TIME':
      return check(supabase.from('time_entries').update({ approved: true }).eq('approved', false))

    case 'ADD_NOTE': {
      const n = action.note
      return check(supabase.from('notes').insert({
        id: n.id, entity_type: n.entityType, entity_id: n.entityId, body: n.body,
        author_id: n.authorId, created_at: n.createdAt,
      }))
    }
    case 'REMOVE_NOTE':
      return check(supabase.from('notes').delete().eq('id', action.id))

    // Local-only actions: no persistence.
    case 'SET_CURRENT_USER':
    case 'HYDRATE':
      return
  }
}
