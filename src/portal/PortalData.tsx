import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Client, Invoice, Job, Quote } from '../data/types'

// Scoped data for the signed-in client. Every query relies on row-level
// security to return only this client's own rows (see 0009_client_portal.sql).

type Row = Record<string, any>
const num = (v: unknown) => Number(v ?? 0)
const mapItems = (rows: Row[]) => rows.map((r) => ({ id: r.id, name: r.name, qty: num(r.qty), unitPrice: num(r.unit_price) }))

export type PortalState = {
  client: Client | null
  quotes: Quote[]
  jobs: Job[]
  invoices: Invoice[]
}

type PortalStore = {
  data: PortalState
  loading: boolean
  linked: boolean // false = login has no matching client record
  refresh: () => Promise<void>
  approveQuote: (id: string) => Promise<void>
}

const PortalContext = createContext<PortalStore | null>(null)
const EMPTY: PortalState = { client: null, quotes: [], jobs: [], invoices: [] }

async function loadPortal(): Promise<{ state: PortalState; linked: boolean }> {
  // Ensure this login is linked to a client record (by matching email).
  const { data: cid } = await supabase.rpc('link_client_account')
  if (!cid) return { state: EMPTY, linked: false }

  const [
    { data: clients }, { data: quotes }, { data: quoteItems },
    { data: jobs }, { data: jobItems }, { data: invoices }, { data: invoiceItems },
  ] = await Promise.all([
    supabase.from('clients').select('*'),
    supabase.from('quotes').select('*').order('created_at', { ascending: false }),
    supabase.from('quote_items').select('*'),
    supabase.from('jobs').select('*').order('start_date', { ascending: false }),
    supabase.from('job_items').select('*'),
    supabase.from('invoices').select('*').order('issued_on', { ascending: false }),
    supabase.from('invoice_items').select('*'),
  ])

  const itemsFor = (rows: Row[] | null, key: string, id: string) => mapItems((rows ?? []).filter((r) => r[key] === id))
  const c = (clients ?? [])[0] as Row | undefined

  return {
    linked: true,
    state: {
      client: c
        ? { id: c.id, name: c.name, company: c.company ?? undefined, email: c.email, phone: c.phone, address: c.address, status: c.status, createdAt: c.created_at }
        : null,
      quotes: (quotes ?? []).map((q: Row) => ({
        id: q.id, number: q.number, clientId: q.client_id, title: q.title,
        status: q.status, createdAt: q.created_at, items: itemsFor(quoteItems, 'quote_id', q.id),
      })),
      jobs: (jobs ?? []).map((j: Row) => ({
        id: j.id, number: j.number, clientId: j.client_id, title: j.title, status: j.status,
        startDate: j.start_date ?? '', endDate: j.end_date ?? '', items: itemsFor(jobItems, 'job_id', j.id), assignedTo: [],
      })),
      invoices: (invoices ?? []).map((i: Row) => ({
        id: i.id, number: i.number, clientId: i.client_id, jobId: i.job_id ?? undefined,
        status: i.status, issuedOn: i.issued_on, dueOn: i.due_on, items: itemsFor(invoiceItems, 'invoice_id', i.id),
      })),
    },
  }
}

export function PortalDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PortalState>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [linked, setLinked] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { state, linked } = await loadPortal()
      setData(state)
      setLinked(linked)
    } catch (e) {
      console.error('Failed to load portal data', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const approveQuote = useCallback(async (id: string) => {
    const { error } = await supabase.rpc('approve_quote', { q_id: id })
    if (error) throw error
    await refresh()
  }, [refresh])

  const value = useMemo(() => ({ data, loading, linked, refresh, approveQuote }), [data, loading, linked, refresh, approveQuote])
  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
}

export function usePortal() {
  const ctx = useContext(PortalContext)
  if (!ctx) throw new Error('usePortal must be used within PortalDataProvider')
  return ctx
}
