import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import { SearchIcon, UserIcon, BriefcaseIcon } from '../components/Icons'
import { useStore } from '../data/store'
import './screens.css'
import './Search.css'

type Result =
  | { kind: 'client'; id: string; title: string; sub: string }
  | { kind: 'job'; id: string; title: string; sub: string }

export default function Search() {
  const { state } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')

  const clientName = (id: string) => state.clients.find((c) => c.id === id)?.name ?? ''

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase()
    if (!term) return []
    const has = (...v: (string | undefined)[]) => v.some((x) => x?.toLowerCase().includes(term))
    const out: Result[] = []
    for (const c of state.clients)
      if (has(c.name, c.company, c.address)) out.push({ kind: 'client', id: c.id, title: c.name, sub: c.address })
    for (const j of state.jobs)
      if (has(j.number, j.title, clientName(j.clientId)))
        out.push({ kind: 'job', id: j.id, title: `${j.number} · ${j.title}`, sub: clientName(j.clientId) })
    return out.slice(0, 20)
  }, [q, state]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <ScreenHeader title="Search" />

      <div className="pad">
        <div className="search-box">
          <SearchIcon size={22} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients and jobs" autoFocus />
        </div>
      </div>

      <div className="divider" />

      <div className="pad">
        {q.trim() === '' ? (
          <p className="muted-sub">Search for a client or job.</p>
        ) : results.length === 0 ? (
          <p className="muted-sub">No matches for “{q}”.</p>
        ) : (
          results.map((r) => (
            <button
              key={r.kind + r.id}
              className="result-row"
              onClick={() => r.kind === 'job' && nav(`/field/job/${r.id}`)}
            >
              <span className="result-avatar">{r.kind === 'job' ? <BriefcaseIcon size={24} /> : <UserIcon size={26} />}</span>
              <div className="result-info">
                <strong>{r.title}</strong>
                <span>{r.sub}</span>
              </div>
              <span className="result-tag">{r.kind === 'job' ? 'Job' : 'Client'}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
