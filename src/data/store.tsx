import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import type {
  Client,
  Invoice,
  Job,
  Quote,
  Request,
  State,
  TimeEntry,
} from './types'
import { seed } from './seed'

type Action =
  | { type: 'ADD_CLIENT'; client: Client }
  | { type: 'ADD_REQUEST'; request: Request }
  | { type: 'ADD_QUOTE'; quote: Quote }
  | { type: 'ADD_JOB'; job: Job }
  | { type: 'ADD_INVOICE'; invoice: Invoice }
  | { type: 'ADD_TIME_ENTRY'; entry: TimeEntry }
  | { type: 'APPROVE_TIME'; id: string }
  | { type: 'APPROVE_ALL_TIME' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_CLIENT':
      return { ...state, clients: [action.client, ...state.clients] }
    case 'ADD_REQUEST':
      return { ...state, requests: [action.request, ...state.requests] }
    case 'ADD_QUOTE':
      return { ...state, quotes: [action.quote, ...state.quotes] }
    case 'ADD_JOB':
      return { ...state, jobs: [action.job, ...state.jobs] }
    case 'ADD_INVOICE':
      return { ...state, invoices: [action.invoice, ...state.invoices] }
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
    default:
      return state
  }
}

type Store = {
  state: State
  dispatch: React.Dispatch<Action>
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, seed)
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

// ---- helpers ---------------------------------------------------------------

let idCounter = 1000
export const newId = (prefix = 'x') => `${prefix}${idCounter++}`

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
