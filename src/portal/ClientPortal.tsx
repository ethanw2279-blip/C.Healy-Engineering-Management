import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { PortalDataProvider, usePortal } from './PortalData'
import { PortalNavProvider, usePortalNav, type PortalView } from './PortalNav'
import { awaitingQuotes, openInvoices, ga1Attention, searchAll, buildNotifications } from './derive'
import {
  IconHome, IconQuote, IconJobs, IconInvoice, IconShield, IconDocs, IconBox, IconSettings,
  IconSearch, IconBell, IconSun, IconMoon, IconPlus,
} from './icons'
import PortalLogin from './PortalLogin'
import Overview from './screens/Overview'
import { Quotes, QuoteDetail } from './screens/Quotes'
import { Jobs, JobDetail } from './screens/Jobs'
import { Invoices, InvoiceDetail } from './screens/Invoices'
import Equipment from './screens/Equipment'
import Request from './screens/Request'
import ComingSoon from './screens/ComingSoon'
import './portal.css'

type Theme = 'light' | 'dark'

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('pt-theme') as Theme) || 'light')
  useEffect(() => { localStorage.setItem('pt-theme', theme) }, [theme])
  return [theme, () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))]
}

const NAV: { group: string; items: { view: PortalView; label: string; Icon: (p: { size?: number }) => JSX.Element }[] }[] = [
  { group: 'Account', items: [
    { view: 'home', label: 'Overview', Icon: IconHome },
    { view: 'quotes', label: 'Quotes', Icon: IconQuote },
    { view: 'jobs', label: 'Jobs & visits', Icon: IconJobs },
    { view: 'invoices', label: 'Invoices', Icon: IconInvoice },
  ] },
  { group: 'Compliance', items: [
    { view: 'equipment', label: 'Equipment & GA1', Icon: IconShield },
    { view: 'documents', label: 'Documents', Icon: IconDocs },
  ] },
  { group: 'Supply', items: [
    { view: 'shop', label: 'Parts & orders', Icon: IconBox },
    { view: 'settings', label: 'Account', Icon: IconSettings },
  ] },
]

function Screen() {
  const { view } = usePortalNav()
  switch (view) {
    case 'home': return <Overview />
    case 'quotes': return <Quotes />
    case 'quote': return <QuoteDetail />
    case 'jobs': return <Jobs />
    case 'job': return <JobDetail />
    case 'invoices': return <Invoices />
    case 'invoice': return <InvoiceDetail />
    case 'equipment': return <Equipment />
    case 'request': return <Request />
    case 'documents': return <ComingSoon title="Documents" blurb="Certificates, method statements and reports — all your issued documents in one place. Wiring up next." />
    case 'shop': return <ComingSoon title="Parts & orders" blurb="Reorder consumables and lifting gear, delivered with your next visit. Wiring up next." />
    case 'settings': return <ComingSoon title="Account" blurb="Notification preferences, people on your account, and billing details. Wiring up next." />
    case 'pay': return <ComingSoon title="Pay invoice" blurb="Secure card and bank payment. Wiring up next." />
    default: return <Overview />
  }
}

function badgeFor(view: PortalView, s: ReturnType<typeof usePortal>['data']): { n: number; tone: 'accent' | 'dark' | 'outline' } | null {
  if (view === 'quotes') { const n = awaitingQuotes(s).length; return n ? { n, tone: 'accent' } : null }
  if (view === 'invoices') { const n = openInvoices(s).length; return n ? { n, tone: 'dark' } : null }
  if (view === 'equipment') { const n = ga1Attention(s).length; return n ? { n, tone: 'outline' } : null }
  return null
}

function Shell() {
  const { data, loading, linked } = usePortal()
  const { view, id, go } = usePortalNav()
  const [theme, toggleTheme] = useTheme()
  const [query, setQuery] = useState('')
  const [bellOpen, setBellOpen] = useState(false)

  if (loading) return <div className="pt" data-theme={theme}><div style={{ padding: 40 }}>Loading…</div></div>

  if (!linked) {
    return (
      <div className="pt" data-theme={theme} style={{ minHeight: '100vh' }}>
        <div className="pt-empty">
          <h1>We couldn't find your account</h1>
          <p>This login isn't linked to a customer record yet. Make sure you signed in with the email address we have on file. If it still doesn't work, get in touch and we'll sort it.</p>
          <button className="btn btn-secondary" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>
    )
  }

  const results = searchAll(data, query)
  const notices = buildNotifications(data)
  const isActive = (v: PortalView) =>
    view === v || (v === 'quotes' && view === 'quote') || (v === 'jobs' && view === 'job') || (v === 'invoices' && view === 'invoice')
  const toneClass = { accent: 'tag-accent', dark: '', outline: 'tag-outline' }

  return (
    <div className="pt pt-shell" data-theme={theme}>
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <nav className="pt-side ptside">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px 14px', borderBottom: '1px solid var(--color-divider)' }}>
          <img src="/logo-mark.png" alt="" style={{ width: 34, height: 34, objectFit: 'contain', flex: 'none' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 16, lineHeight: 1.1 }}>C.Healy Engineering</div>
            <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-accent-700)' }}>Client portal</div>
          </div>
        </div>

        <div className="pscroll" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
          {NAV.map((section) => (
            <div key={section.group}>
              <div className="pt-navgroup">{section.group}</div>
              {section.items.map(({ view: v, label, Icon }) => {
                const b = badgeFor(v, data)
                return (
                  <button key={v} className={`pnav pt-navbtn ${isActive(v) ? 'active' : ''}`} onClick={() => go(v)}>
                    <Icon size={17} />
                    <span style={{ flex: 1 }}>{label}</span>
                    {b && <span className={`pt-navbadge ${toneClass[b.tone]}`} style={b.tone === 'dark' ? { background: 'var(--color-accent-700)', color: 'var(--color-bg)' } : b.tone === 'accent' ? { background: 'var(--color-accent)', color: 'var(--color-bg)' } : { border: '1px solid var(--color-accent)', color: 'var(--color-accent-800)' }}>{b.n}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div style={{ padding: 12, borderTop: '1px solid var(--color-divider)' }}>
          <button className="btn btn-primary btn-block" style={{ margin: 0 }} onClick={() => go('request')}>
            <IconPlus size={15} /> Request work
          </button>
          <div style={{ marginTop: 14, fontSize: 11.5, lineHeight: 1.5, color: 'var(--color-neutral-700)' }}>
            <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>Need us urgently?</div>
            <a href="tel:+353862771717">+353 86 277 1717</a><br />
            <a href="mailto:info@chealyengineering.ie">info@chealyengineering.ie</a>
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 12, paddingInline: 0 }} onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </nav>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="pt-main">
        <header className="pt-header">
          <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
            <span style={{ position: 'absolute', left: 11, top: 11, opacity: 0.5 }}><IconSearch size={15} /></span>
            <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search quotes, jobs, invoices…" style={{ paddingLeft: 31, fontSize: 13 }} />
            {results.length > 0 && (
              <div className="pt-dropdown pscroll" style={{ top: 44, left: 0, width: 340, maxHeight: 320, overflowY: 'auto' }}>
                {results.map((r, idx) => (
                  <button key={idx} className="prow" onClick={() => { go(r.view, r.id); setQuery('') }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', border: 'none', borderBottom: '1px solid color-mix(in srgb,var(--color-text) 8%,transparent)', background: 'none', font: 'inherit', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}>
                    <span style={{ fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-accent-700)', width: 56, flex: 'none' }}>{r.kind}</span>
                    <span style={{ flex: 1, fontSize: 13 }}>{r.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-secondary btn-icon" title="Switch theme" onClick={toggleTheme}>
              {theme === 'dark' ? <IconSun size={17} /> : <IconMoon size={17} />}
            </button>
            <button className="btn btn-secondary btn-icon" style={{ position: 'relative' }} onClick={() => setBellOpen((o) => !o)}>
              <IconBell size={17} />
              {notices.length > 0 && <span style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: 999, background: 'var(--color-accent)' }} />}
            </button>
            <button className="pnav" onClick={() => go('settings')} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 9px 5px 5px', border: '1px solid var(--color-divider)', borderRadius: 999, background: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer' }}>
              <span style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', borderRadius: 999, background: 'var(--color-accent-900)', color: 'var(--color-bg)', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 12 }}>{initials(data.client?.name)}</span>
              <span style={{ textAlign: 'left', lineHeight: 1.15, maxWidth: 120, overflow: 'hidden' }}>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.client?.name}</span>
              </span>
            </button>
          </div>

          {bellOpen && (
            <div className="pt-dropdown" style={{ right: 20, top: 52, width: 330 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px', borderBottom: '1px solid var(--color-divider)' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 15 }}>Notifications</span>
                <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setBellOpen(false)}>Close</button>
              </div>
              {notices.length === 0 ? (
                <div style={{ padding: '18px 13px', fontSize: 13, color: 'var(--color-neutral-700)' }}>You're all caught up.</div>
              ) : notices.map((n) => (
                <button key={n.id} className="prow" onClick={() => { go(n.view, n.targetId); setBellOpen(false) }} style={{ display: 'block', width: '100%', padding: '11px 13px', border: 'none', borderBottom: '1px solid color-mix(in srgb,var(--color-text) 8%,transparent)', background: 'none', font: 'inherit', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.35 }}>{n.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-neutral-700)', marginTop: 2 }}>{n.meta}</div>
                </button>
              ))}
            </div>
          )}
        </header>

        <div className="pt-content pscroll">
          <div className="pt-page" key={`${view}-${id ?? ''}`}>
            <Screen />
          </div>
        </div>

        {/* Mobile bottom tabs */}
        <nav className="pt-mobile-tabs">
          {([['home', 'Home', IconHome], ['quotes', 'Quotes', IconQuote], ['invoices', 'Invoices', IconInvoice], ['equipment', 'GA1', IconShield], ['settings', 'Account', IconSettings]] as const).map(([v, label, Icon]) => (
            <button key={v} className={isActive(v) ? 'active' : ''} onClick={() => go(v)}>
              <Icon size={20} /><span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

function initials(name?: string | null) {
  if (!name) return '—'
  return name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

export default function ClientPortal() {
  const { ready, session } = useAuth()

  if (!isSupabaseConfigured) {
    return (
      <div className="pt" style={{ minHeight: '100vh' }}>
        <div className="pt-empty">
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
      <PortalNavProvider>
        <Shell />
      </PortalNavProvider>
    </PortalDataProvider>
  )
}
