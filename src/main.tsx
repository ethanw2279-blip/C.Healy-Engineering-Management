import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { StoreProvider } from './data/store'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import Login from './auth/Login'
import ResetPassword from './auth/ResetPassword'
import ClientPortal from './portal/ClientPortal'
import { isSupabaseConfigured } from './lib/supabaseClient'
import './index.css'

// The client portal is a separate mini-app with its own login and tightly
// scoped data. It never touches the staff store, so branch on the path here.
const isPortal = window.location.pathname.startsWith('/portal')

// When Supabase is configured, require a login before the app loads. When it
// isn't (e.g. local demo), fall straight through to the in-memory store.
function Gate() {
  const { ready, session, recovering } = useAuth()

  if (isSupabaseConfigured) {
    if (!ready) return <div className="app-splash">Loading…</div>
    if (recovering) return <ResetPassword />
    if (!session) return <Login />
  }

  return (
    <StoreProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StoreProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      {isPortal ? <ClientPortal /> : <Gate />}
    </AuthProvider>
  </StrictMode>,
)

// Register the service worker for offline support + push (production only —
// the dev server serves modules the SW shouldn't cache).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => console.error('SW registration failed', e))
  })
}
