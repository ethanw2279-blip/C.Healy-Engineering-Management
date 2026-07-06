import { useState } from 'react'
import { SearchIcon, BellIcon, PlusIcon, ChevronDownIcon } from '../components/Icons'
import { Button } from './components/ui'
import type { CreateKind } from './CreateModals'

const createOptions: { kind: CreateKind; label: string }[] = [
  { kind: 'client', label: 'Client' },
  { kind: 'request', label: 'Request' },
  { kind: 'quote', label: 'Quote' },
  { kind: 'job', label: 'Job' },
  { kind: 'invoice', label: 'Invoice' },
]

export default function Topbar({ onCreate }: { onCreate: (k: CreateKind) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="topbar">
      <div className="topbar-search">
        <SearchIcon size={19} />
        <input placeholder="Search clients, jobs, quotes…" />
      </div>

      <div className="topbar-actions">
        <button className="topbar-icon" aria-label="Notifications">
          <BellIcon size={21} />
        </button>

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
      </div>
    </header>
  )
}
