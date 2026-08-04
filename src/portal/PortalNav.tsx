import { createContext, useContext, useCallback, useMemo, useState, type ReactNode } from 'react'

// The portal is a single-page state machine (mirrors the approved design's
// goHome/goQuotes/… model) rather than nested router paths. A view is a screen
// id plus an optional selected record id for detail screens.

export type PortalView =
  | 'home' | 'quotes' | 'quote' | 'jobs' | 'job' | 'invoices' | 'invoice'
  | 'equipment' | 'documents' | 'shop' | 'request' | 'settings' | 'pay'

type NavState = { view: PortalView; id?: string }

type PortalNavValue = {
  view: PortalView
  id?: string
  go: (view: PortalView, id?: string) => void
}

const PortalNavContext = createContext<PortalNavValue | null>(null)

// Map the initial URL path to a starting view so email deep-links land right
// (e.g. /portal/ga1 → Equipment & GA1, /portal/invoices → Invoices).
function initialView(): NavState {
  const p = window.location.pathname
  if (p.includes('/ga1') || p.includes('/equipment')) return { view: 'equipment' }
  if (p.includes('/quotes')) return { view: 'quotes' }
  if (p.includes('/jobs')) return { view: 'jobs' }
  if (p.includes('/invoices')) return { view: 'invoices' }
  if (p.includes('/documents')) return { view: 'documents' }
  if (p.includes('/shop') || p.includes('/parts')) return { view: 'shop' }
  if (p.includes('/pay')) return { view: 'pay' }
  if (p.includes('/request')) return { view: 'request' }
  if (p.includes('/settings') || p.includes('/account')) return { view: 'settings' }
  return { view: 'home' }
}

export function PortalNavProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NavState>(initialView)

  const go = useCallback((view: PortalView, id?: string) => {
    setState({ view, id })
    // Keep the URL roughly in sync for shareable deep-links, without a router.
    const path = view === 'home' ? '/portal' : `/portal/${view}${id ? `/${id}` : ''}`
    try { window.history.replaceState(null, '', path) } catch { /* ignore */ }
    const scroller = document.querySelector('.pt-content')
    if (scroller) scroller.scrollTop = 0
  }, [])

  const value = useMemo(() => ({ view: state.view, id: state.id, go }), [state, go])
  return <PortalNavContext.Provider value={value}>{children}</PortalNavContext.Provider>
}

export function usePortalNav() {
  const ctx = useContext(PortalNavContext)
  if (!ctx) throw new Error('usePortalNav must be used within PortalNavProvider')
  return ctx
}
