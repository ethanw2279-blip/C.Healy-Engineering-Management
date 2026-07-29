import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchIcon } from '../components/Icons'
import { useStore, useCurrentUser } from '../data/store'

type Result = { type: string; id: string; to: string; title: string; sub: string }

export default function GlobalSearch() {
  const { state } = useStore()
  const { can } = useCurrentUser()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [focused, setFocused] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const clientName = (id: string) => state.clients.find((c) => c.id === id)?.name ?? ''

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase()
    if (!term) return []
    const has = (...vals: (string | undefined)[]) =>
      vals.some((v) => v?.toLowerCase().includes(term))
    const out: Result[] = []

    if (can('view:clients'))
      for (const c of state.clients)
        if (has(c.name, c.company, c.email, c.phone))
          out.push({ type: 'Client', id: c.id, to: `/clients/${c.id}`, title: c.name, sub: c.company ?? c.email })

    if (can('view:quotes'))
      for (const x of state.quotes)
        if (has(x.number, x.title, clientName(x.clientId)))
          out.push({ type: 'Quote', id: x.id, to: `/quotes/${x.id}`, title: `${x.number} · ${x.title}`, sub: clientName(x.clientId) })

    if (can('view:jobs'))
      for (const x of state.jobs)
        if (has(x.number, x.title, clientName(x.clientId)))
          out.push({ type: 'Job', id: x.id, to: `/jobs/${x.id}`, title: `${x.number} · ${x.title}`, sub: clientName(x.clientId) })

    if (can('view:invoices'))
      for (const x of state.invoices)
        if (has(x.number, clientName(x.clientId)))
          out.push({ type: 'Invoice', id: x.id, to: `/invoices/${x.id}`, title: x.number, sub: clientName(x.clientId) })

    if (can('view:requests'))
      for (const x of state.requests)
        if (has(x.title, x.service, clientName(x.clientId)))
          out.push({ type: 'Request', id: x.id, to: `/requests/${x.id}`, title: x.title, sub: clientName(x.clientId) })

    return out.slice(0, 8)
  }, [q, state]) // eslint-disable-line react-hooks/exhaustive-deps

  const go = (to: string) => {
    nav(to)
    setQ('')
    inputRef.current?.blur()
  }

  const showPanel = focused && q.trim().length > 0

  return (
    <div className={`search-wrap ${mobileOpen ? 'search-open' : ''}`}>
      {/* On mobile this shows as just the magnifier; tapping expands the field. */}
      <div className="topbar-search" onClick={() => { setMobileOpen(true); inputRef.current?.focus() }}>
        <SearchIcon size={19} />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => { setFocused(false); setMobileOpen(false) }, 120)}
          onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) go(results[0].to) }}
          placeholder="Search clients, jobs, quotes…"
        />
      </div>

      {showPanel && (
        <div className="search-results">
          {results.length === 0 ? (
            <div className="search-empty">No matches for “{q}”</div>
          ) : (
            results.map((r) => (
              <button key={r.type + r.id} className="search-item" onMouseDown={() => go(r.to)}>
                <span className={`search-type t-${r.type.toLowerCase()}`}>{r.type}</span>
                <span className="search-text">
                  <span className="search-title">{r.title}</span>
                  {r.sub && <span className="search-sub">{r.sub}</span>}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
