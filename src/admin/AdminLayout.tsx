import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import CreateModals, { type CreateKind } from './CreateModals'
import './admin.css'

export default function AdminLayout() {
  const [creating, setCreating] = useState<CreateKind | null>(null)

  return (
    <div className="admin">
      <Sidebar />
      <div className="admin-main">
        <Topbar onCreate={setCreating} />
        <main className="admin-content">
          {/* Pages can trigger the same create flows via this context prop. */}
          <Outlet context={{ create: setCreating }} />
        </main>
      </div>
      {creating && <CreateModals kind={creating} onClose={() => setCreating(null)} />}
    </div>
  )
}
