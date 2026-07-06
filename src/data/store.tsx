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
  Client,
  Employee,
  Invoice,
  Job,
  Quote,
  Request,
  Role,
  State,
  TimeEntry,
} from './types'
import { seed } from './seed'
import { roleCan, type PermissionKey } from './permissions'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { loadState, persist } from './api'

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
  | { type: 'APPROVE_TIME'; id: string }
  | { type: 'APPROVE_ALL_TIME' }
  | { type: 'ADD_EMPLOYEE'; employee: Employee }
  | { type: 'UPDATE_EMPLOYEE'; employee: Employee }
  | { type: 'REMOVE_EMPLOYEE'; id: string }
  | { type: 'ADD_ROLE'; role: Role }
  | { type: 'UPDATE_ROLE'; role: Role }
  | { type: 'DELETE_ROLE'; id: string }
  | { type: 'SET_CURRENT_USER'; id: string }
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
  quotes: [], jobs: [], invoices: [], timeEntries: [], visits: [],
}

export function StoreProvider({ children }: { children: ReactNode }) {
  // Demo mode (no Supabase env): start from the in-memory seed. DB mode: start
  // empty and hydrate from Supabase.
  const [state, rawDispatch] = useReducer(reducer, isSupabaseConfigured ? EMPTY_STATE : seed)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let alive = true
    loadState()
      .then((s) => alive && rawDispatch({ type: 'HYDRATE', state: s }))
      .catch((e) => console.error('Failed to load data from Supabase', e))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  // Optimistically update local state, then write the change through to
  // Supabase. On failure, reload from the database to reconcile.
  const dispatch = useCallback<React.Dispatch<Action>>((action) => {
    rawDispatch(action)
    if (isSupabaseConfigured && action.type !== 'HYDRATE') {
      persist(action).catch(async (e) => {
        console.error('Failed to save change to Supabase', e)
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
  const can = (key: PermissionKey) => roleCan(role, key)
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
