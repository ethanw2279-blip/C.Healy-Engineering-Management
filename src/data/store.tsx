import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'
import type {
  Attachment,
  Client,
  Employee,
  GA1Inspection,
  Invoice,
  Job,
  Note,
  Order,
  Product,
  Quote,
  Request,
  Role,
  State,
  TimeEntry,
  Visit,
} from './types'
import { seed } from './seed'
import { roleCan, type PermissionKey } from './permissions'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { loadState, persist } from './api'
import { readCache, writeCache, enqueue, flushOutbox } from './offline'

export type Action =
  | { type: 'ADD_CLIENT'; client: Client }
  | { type: 'UPDATE_CLIENT'; client: Client }
  | { type: 'REMOVE_CLIENT'; id: string }
  | { type: 'ADD_REQUEST'; request: Request }
  | { type: 'UPDATE_REQUEST'; request: Request }
  | { type: 'REMOVE_REQUEST'; id: string }
  | { type: 'ADD_QUOTE'; quote: Quote }
  | { type: 'UPDATE_QUOTE'; quote: Quote }
  | { type: 'REMOVE_QUOTE'; id: string }
  | { type: 'ADD_JOB'; job: Job }
  | { type: 'UPDATE_JOB'; job: Job }
  | { type: 'REMOVE_JOB'; id: string }
  | { type: 'ADD_INVOICE'; invoice: Invoice }
  | { type: 'UPDATE_INVOICE'; invoice: Invoice }
  | { type: 'REMOVE_INVOICE'; id: string }
  | { type: 'ADD_TIME_ENTRY'; entry: TimeEntry }
  | { type: 'UPDATE_TIME_ENTRY'; entry: TimeEntry }
  | { type: 'REMOVE_TIME_ENTRY'; id: string }
  | { type: 'APPROVE_TIME'; id: string }
  | { type: 'APPROVE_ALL_TIME' }
  | { type: 'ADD_EMPLOYEE'; employee: Employee }
  | { type: 'UPDATE_EMPLOYEE'; employee: Employee }
  | { type: 'REMOVE_EMPLOYEE'; id: string }
  | { type: 'ADD_ROLE'; role: Role }
  | { type: 'UPDATE_ROLE'; role: Role }
  | { type: 'DELETE_ROLE'; id: string }
  | { type: 'SET_CURRENT_USER'; id: string }
  | { type: 'ADD_NOTE'; note: Note }
  | { type: 'REMOVE_NOTE'; id: string }
  | { type: 'ADD_GA1'; inspection: GA1Inspection }
  | { type: 'UPDATE_GA1'; inspection: GA1Inspection }
  | { type: 'REMOVE_GA1'; id: string }
  | { type: 'ADD_VISIT'; visit: Visit }
  | { type: 'UPDATE_VISIT'; visit: Visit }
  | { type: 'REMOVE_VISIT'; id: string }
  | { type: 'ADD_ATTACHMENT'; attachment: Attachment }
  | { type: 'REMOVE_ATTACHMENT'; id: string }
  | { type: 'ADD_PRODUCT'; product: Product }
  | { type: 'UPDATE_PRODUCT'; product: Product }
  | { type: 'REMOVE_PRODUCT'; id: string }
  | { type: 'ADD_ORDER'; order: Order }
  | { type: 'UPDATE_ORDER'; order: Order }
  | { type: 'REMOVE_ORDER'; id: string }
  | { type: 'HYDRATE'; state: State }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return action.state
    case 'ADD_CLIENT':
      return { ...state, clients: [action.client, ...state.clients] }
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map((c) => (c.id === action.client.id ? action.client : c)),
      }
    case 'REMOVE_CLIENT':
      return { ...state, clients: state.clients.filter((c) => c.id !== action.id) }
    case 'ADD_REQUEST':
      return { ...state, requests: [action.request, ...state.requests] }
    case 'UPDATE_REQUEST':
      return {
        ...state,
        requests: state.requests.map((r) => (r.id === action.request.id ? action.request : r)),
      }
    case 'REMOVE_REQUEST':
      return { ...state, requests: state.requests.filter((r) => r.id !== action.id) }
    case 'ADD_QUOTE':
      return { ...state, quotes: [action.quote, ...state.quotes] }
    case 'UPDATE_QUOTE':
      return {
        ...state,
        quotes: state.quotes.map((q) => (q.id === action.quote.id ? action.quote : q)),
      }
    case 'REMOVE_QUOTE':
      return { ...state, quotes: state.quotes.filter((q) => q.id !== action.id) }
    case 'ADD_JOB':
      return { ...state, jobs: [action.job, ...state.jobs] }
    case 'UPDATE_JOB':
      return {
        ...state,
        jobs: state.jobs.map((j) => (j.id === action.job.id ? action.job : j)),
      }
    case 'REMOVE_JOB':
      return {
        ...state,
        jobs: state.jobs.filter((j) => j.id !== action.id),
        visits: state.visits.filter((v) => v.jobId !== action.id),
      }
    case 'ADD_INVOICE':
      return { ...state, invoices: [action.invoice, ...state.invoices] }
    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map((i) => (i.id === action.invoice.id ? action.invoice : i)),
      }
    case 'REMOVE_INVOICE':
      return { ...state, invoices: state.invoices.filter((i) => i.id !== action.id) }
    case 'ADD_TIME_ENTRY':
      return { ...state, timeEntries: [action.entry, ...state.timeEntries] }
    case 'UPDATE_TIME_ENTRY':
      return {
        ...state,
        timeEntries: state.timeEntries.map((t) => (t.id === action.entry.id ? action.entry : t)),
      }
    case 'REMOVE_TIME_ENTRY':
      return { ...state, timeEntries: state.timeEntries.filter((t) => t.id !== action.id) }
    case 'APPROVE_TIME':
      return {
        ...state,
        timeEntries: state.timeEntries.map((t) =>
          t.id === action.id ? { ...t, approved: true } : t,
        ),
      }
    case 'APPROVE_ALL_TIME':
      return {
        ...state,
        timeEntries: state.timeEntries.map((t) => ({ ...t, approved: true })),
      }
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.employee] }
    case 'UPDATE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.map((e) => (e.id === action.employee.id ? action.employee : e)),
      }
    case 'REMOVE_EMPLOYEE':
      return { ...state, employees: state.employees.filter((e) => e.id !== action.id) }
    case 'ADD_ROLE':
      return { ...state, roles: [...state.roles, action.role] }
    case 'UPDATE_ROLE':
      return {
        ...state,
        roles: state.roles.map((r) => (r.id === action.role.id ? action.role : r)),
      }
    case 'DELETE_ROLE':
      return { ...state, roles: state.roles.filter((r) => r.id !== action.id) }
    case 'SET_CURRENT_USER':
      return { ...state, currentUserId: action.id }
    case 'ADD_NOTE':
      return { ...state, notes: [action.note, ...state.notes] }
    case 'REMOVE_NOTE':
      return { ...state, notes: state.notes.filter((n) => n.id !== action.id) }
    case 'ADD_GA1':
      return { ...state, ga1: [action.inspection, ...state.ga1] }
    case 'UPDATE_GA1':
      return {
        ...state,
        ga1: state.ga1.map((g) => (g.id === action.inspection.id ? action.inspection : g)),
      }
    case 'REMOVE_GA1':
      return { ...state, ga1: state.ga1.filter((g) => g.id !== action.id) }
    case 'ADD_VISIT':
      return { ...state, visits: [...state.visits, action.visit] }
    case 'UPDATE_VISIT':
      return {
        ...state,
        visits: state.visits.map((v) => (v.id === action.visit.id ? action.visit : v)),
      }
    case 'REMOVE_VISIT':
      return { ...state, visits: state.visits.filter((v) => v.id !== action.id) }
    case 'ADD_ATTACHMENT':
      return { ...state, attachments: [action.attachment, ...state.attachments] }
    case 'REMOVE_ATTACHMENT':
      return { ...state, attachments: state.attachments.filter((a) => a.id !== action.id) }
    case 'ADD_PRODUCT':
      return { ...state, products: [action.product, ...state.products] }
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map((p) => (p.id === action.product.id ? action.product : p)),
      }
    case 'REMOVE_PRODUCT':
      return { ...state, products: state.products.filter((p) => p.id !== action.id) }
    case 'ADD_ORDER':
      return { ...state, orders: [action.order, ...state.orders] }
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === action.order.id ? action.order : o)),
      }
    case 'REMOVE_ORDER':
      return { ...state, orders: state.orders.filter((o) => o.id !== action.id) }
    default:
      return state
  }
}

type Store = {
  state: State
  dispatch: React.Dispatch<Action>
}

const StoreContext = createContext<Store | null>(null)

const EMPTY_STATE: State = {
  roles: [], currentUserId: '', employees: [], clients: [], requests: [],
  quotes: [], jobs: [], invoices: [], timeEntries: [], visits: [], notes: [], ga1: [], attachments: [],
  products: [], orders: [],
}

// Initial state: demo mode uses the in-memory seed. DB mode starts from the
// last cached state (so the app opens instantly / offline) or empty.
function initialState(): State {
  if (!isSupabaseConfigured) return seed
  return readCache() ?? EMPTY_STATE
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, undefined, initialState)
  // Only block on first load when there's no cache to show yet.
  const [loading, setLoading] = useState(isSupabaseConfigured && !readCache())

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let alive = true
    // Send anything queued while offline, then pull fresh server state.
    flushOutbox()
      .then(() => loadState())
      .then((s) => alive && rawDispatch({ type: 'HYDRATE', state: s }))
      .catch((e) => console.error('Failed to load data from Supabase', e))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  // Keep the offline cache in sync with the latest state.
  useEffect(() => {
    if (isSupabaseConfigured) writeCache(state)
  }, [state])

  // When the connection returns, flush queued writes then reconcile.
  useEffect(() => {
    if (!isSupabaseConfigured) return
    const onOnline = () => {
      flushOutbox()
        .then(() => loadState())
        .then((s) => rawDispatch({ type: 'HYDRATE', state: s }))
        .catch(() => { /* still flaky — try again next reconnect */ })
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  // Optimistically update local state, then write through to Supabase. Offline,
  // queue the write in the outbox to replay on reconnect. On a live failure,
  // reload from the database to reconcile.
  const dispatch = useCallback<React.Dispatch<Action>>((action) => {
    rawDispatch(action)
    if (isSupabaseConfigured && action.type !== 'HYDRATE') {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueue(action)
        return
      }
      persist(action).catch(async (e) => {
        console.error('Failed to save change to Supabase', e)
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          enqueue(action)
          return
        }
        try {
          const s = await loadState()
          rawDispatch({ type: 'HYDRATE', state: s })
        } catch {
          /* keep optimistic state if reload also fails */
        }
      })
    }
  }, [])

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch])

  if (isSupabaseConfigured && loading) {
    return <div className="app-splash">Loading…</div>
  }
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

// Resolves the signed-in employee, their role, and a `can()` permission check.
export function useCurrentUser() {
  const { state } = useStore()
  const user = state.employees.find((e) => e.id === state.currentUserId) ?? state.employees[0]
  const role = state.roles.find((r) => r.id === user?.roleId)
  // GA1 access can be granted per person on top of the role's permissions.
  const can = (key: PermissionKey) =>
    roleCan(role, key) || (key === 'view:ga1' && !!user?.ga1Access)
  return { user, role, can }
}

export const roleOf = (state: State, roleId: string) =>
  state.roles.find((r) => r.id === roleId)

export const roleNameOf = (state: State, roleId: string) =>
  roleOf(state, roleId)?.name ?? 'No role'

// ---- helpers ---------------------------------------------------------------

// Real UUIDs so records insert cleanly into the Postgres uuid columns. The
// prefix arg is kept for call-site compatibility but no longer used.
export const newId = (_prefix = 'x') => crypto.randomUUID()

export const eur = (n: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export const eurExact = (n: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n)

export const itemsTotal = (items: { qty: number; unitPrice: number }[]) =>
  items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0)

export const quoteTotal = (q: Quote) => itemsTotal(q.items)
export const jobTotal = (j: Job) => itemsTotal(j.items)
export const invoiceTotal = (i: Invoice) => itemsTotal(i.items)
export const orderTotal = (o: { items: { qty: number; unitPrice: number }[] }) => itemsTotal(o.items)

export const formatDate = (iso: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const formatDateShort = (iso: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })
}
