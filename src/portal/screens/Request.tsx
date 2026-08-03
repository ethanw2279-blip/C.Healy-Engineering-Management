import { useState } from 'react'
import { usePortal } from '../PortalData'
import { usePortalNav } from '../PortalNav'
import { supabase } from '../../lib/supabaseClient'

const SERVICES = ['Fleet wash', 'GA1 thorough examination', 'Equipment service or repair', 'Depot / yard clean', 'Something else']
const URGENCIES = ['Next available', 'Within a week', 'Urgent — today']

export default function Request() {
  const { data, refresh } = usePortal()
  const { go } = usePortalNav()
  const [service, setService] = useState(SERVICES[0])
  const [site, setSite] = useState(data.client?.address || '')
  const [urgency, setUrgency] = useState(URGENCIES[0])
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const send = async () => {
    setError(null); setBusy(true)
    try {
      const { data: sess } = await supabase.auth.getSession()
      const token = sess.session?.access_token
      if (!token) throw new Error('You need to be signed in.')
      const res = await fetch('/api/portal/request', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, site, urgency, details }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `Could not send the request (${res.status}).`)
      setSent(true)
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the request.')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div style={{ maxWidth: 520, margin: '40px auto 0', textAlign: 'center' }}>
        <div className="blueprint" style={{ padding: '34px 28px' }}>
          <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-accent-700)', marginBottom: 8 }}>Request received</div>
          <h1 style={{ fontSize: 30, margin: '0 0 6px' }}>Got it, thank you</h1>
          <p style={{ fontSize: 14, color: 'var(--color-neutral-700)', margin: '0 0 20px' }}>We'll be back to you with a quote, usually within one working day. It'll appear under Quotes and we'll email you.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => setSent(false)}>Request something else</button>
            <button className="btn btn-primary" onClick={() => go('home')}>Back to overview</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <h1 style={{ fontSize: 32, margin: '0 0 4px' }}>Request work</h1>
      <p style={{ fontSize: 14, color: 'var(--color-neutral-700)', margin: '0 0 22px' }}>Tell us what you need. We'll come back with a quote — usually within one working day.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 22, alignItems: 'start' }}>
        <div className="blueprint" style={{ padding: '18px 20px' }}>
          <div className="field" style={{ marginBottom: 13 }}>
            <label>What do you need?</label>
            <select className="input" value={service} onChange={(e) => setService(e.target.value)}>
              {SERVICES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 13 }}>
            <label>Site</label>
            <input className="input" value={site} onChange={(e) => setSite(e.target.value)} placeholder="Where is the work?" />
          </div>
          <div className="field" style={{ marginBottom: 13 }}>
            <label>How soon?</label>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', paddingTop: 3 }}>
              {URGENCIES.map((u) => (
                <label key={u} className="radio"><input type="radio" name="urg" checked={urgency === u} onChange={() => setUrgency(u)} /><span className="dot" />{u}</label>
              ))}
            </div>
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Details</label>
            <textarea className="input" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Vehicles, access, gate codes, anything the crew should know…" />
          </div>
          {error && <div className="pt-callout" style={{ marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary btn-block" onClick={send} disabled={busy} style={{ padding: 11 }}>{busy ? 'Sending…' : 'Send request'}</button>
        </div>
        <div>
          <div style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--pt-r)', padding: '16px 18px', marginBottom: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-neutral-600)', marginBottom: 8 }}>What happens next</div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.75 }}>
              <li>We review it and call if anything's unclear.</li>
              <li>You get a quote in the portal to approve or decline.</li>
              <li>Approved work is scheduled and you're told the date.</li>
            </ol>
          </div>
          <div style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--pt-r)', padding: '16px 18px' }}>
            <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-neutral-600)', marginBottom: 8 }}>Something broken right now?</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: '0 0 10px' }}>Don't use the form — ring the yard.</p>
            <a href="tel:+353862771717" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 22 }}>+353 86 277 1717</a>
          </div>
        </div>
      </div>
    </>
  )
}
