import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { PortalDataProvider, usePortal } from './PortalData'
import PortalLogin from './PortalLogin'
import PortalHome from './PortalHome'
import PortalQuote from './PortalQuote'
import PortalInvoice from './PortalInvoice'
import PortalGA1 from './PortalGA1'
import './portal.css'

function PortalLayout() {
  const { data, loading, linked } = usePortal()
  const nav = useNavigate()

  if (loading) return <div className="app-splash">Loading…</div>

  if (!linked) {
    return (
      <div className="portal-shell">
        <div className="portal-empty">
          <h1>We couldn't find your account</h1>
          <p>
            This login isn't linked to a customer record yet. Make sure you signed in with the
            email address we have on file. If it still doesn't work, get in touch and we'll sort it.
          </p>
          <button className="portal-btn ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>
    )
  }

  return (
    <div className="portal-shell">
      <header className="portal-header">
        <button className="portal-brand" onClick={() => nav('/portal')}>
          <img className="portal-mark" src="/logo-mark.png" alt="C.Healy Engineering" />
          <div>
            <strong>C.Healy Engineering</strong>
            <span>{data.client?.name}</span>
          </div>
        </button>
        <nav className="portal-nav">
          <button onClick={() => nav('/portal')}>Home</button>
          <button onClick={() => nav('/portal/ga1')}>GA1 Reports</button>
        </nav>
        <button className="portal-signout" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </header>
      <main className="portal-main">
        <Outlet />
      </main>
    </div>
  )
}

export default function ClientPortal() {
  const { ready, session } = useAuth()

  if (!isSupabaseConfigured) {
    return (
      <div className="portal-shell">
        <div className="portal-empty">
          <h1>Client portal</h1>
          <p>The portal needs the connected database. It isn't available in the local demo.</p>
        </div>
      </div>
    )
  }

  if (!ready) return <div className="app-splash">Loading…</div>
  if (!session) return <PortalLogin />

  return (
    <PortalDataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PortalLayout />}>
            <Route path="/portal" element={<PortalHome />} />
            <Route path="/portal/ga1" element={<PortalGA1 />} />
            <Route path="/portal/quotes/:id" element={<PortalQuote />} />
            <Route path="/portal/invoices/:id" element={<PortalInvoice />} />
            <Route path="*" element={<Navigate to="/portal" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PortalDataProvider>
  )
}
