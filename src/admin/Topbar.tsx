import { useState } from 'react'
import { SearchIcon, BellIcon, PlusIcon, ChevronDownIcon, LogoutIcon } from '../components/Icons'
import { Button, Avatar } from './components/ui'
import type { CreateKind } from './CreateModals'
import { useStore, useCurrentUser } from '../data/store'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'

const createOptions: { kind: CreateKind; label: string }[] = [
  { kind: 'client', label: 'Client' },
  { kind: 'request', label: 'Request' },
  { kind: 'quote', label: 'Quote' },
  { kind: 'job', label: 'Job' },
  { kind: 'invoice', label: 'Invoice' },
]

export default function Topbar({ onCreate }: { onCreate: (k: CreateKind) => void }) {
  const { state, dispatch } = useStore()
  const { user, role, can } = useCurrentUser()
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [viewAs, setViewAs] = useState(false)

  return (
    <header className="topbar">
      <div className="topbar-search">
        <SearchIcon size={19} />
        <input placeholder="Search clients, jobs, quotes…" />
      </div>

      <div className="topbar-actions">
        {isSupabaseConfigured ? (
          /* Logged-in user + sign out. */
          <div className="viewas-wrap" onMouseLeave={() => setViewAs(false)}>
            <button className="viewas-btn" onClick={() => setViewAs((v) => !v)}>
              <Avatar name={user?.name ?? '?'} color={user?.color} size={26} />
              <span className="viewas-text">
                <em>Signed in</em>
                <strong>{user?.name ?? 'Account'} · {role?.name ?? 'No role'}</strong>
              </span>
              <ChevronDownIcon size={16} />
            </button>
            {viewAs && (
              <div className="viewas-menu">
                <button className="viewas-item" onClick={() => signOut()}>
                  <LogoutIcon size={20} />
                  <span className="cell-strong">Sign out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Demo mode: preview the app as any team member to test roles. */
          <div className="viewas-wrap" onMouseLeave={() => setViewAs(false)}>
            <button className="viewas-btn" onClick={() => setViewAs((v) => !v)}>
              <Avatar name={user?.name ?? '?'} color={user?.color} size={26} />
              <span className="viewas-text">
                <em>Viewing as</em>
                <strong>{user?.name} · {role?.name}</strong>
              </span>
              <ChevronDownIcon size={16} />
            </button>
            {viewAs && (
              <div className="viewas-menu">
                <div className="viewas-head">Preview access as</div>
                {state.employees.map((e) => {
                  const r = state.roles.find((x) => x.id === e.roleId)
                  return (
                    <button
                      key={e.id}
                      className={`viewas-item ${e.id === user?.id ? 'on' : ''}`}
                      onClick={() => {
                        dispatch({ type: 'SET_CURRENT_USER', id: e.id })
                        setViewAs(false)
                      }}
                    >
                      <Avatar name={e.name} color={e.color} size={26} />
                      <span className="stack-tight">
                        <span className="cell-strong">{e.name}</span>
                        <span className="cell-muted">{r?.name}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <button className="topbar-icon" aria-label="Notifications">
          <BellIcon size={21} />
        </button>

        {can('create:records') && (
          <div className="create-wrap" onMouseLeave={() => setOpen(false)}>
            <Button onClick={() => setOpen((v) => !v)}>
              <PlusIcon size={18} strokeWidth={2.4} />
              Create
              <ChevronDownIcon size={16} />
            </Button>
            {open && (
              <div className="create-menu">
                {createOptions.map((o) => (
                  <button
                    key={o.kind}
                    className="create-item"
                    onClick={() => {
                      setOpen(false)
                      onCreate(o.kind)
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
