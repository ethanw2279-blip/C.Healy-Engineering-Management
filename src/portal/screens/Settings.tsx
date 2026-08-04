import { useState } from 'react'
import { usePortal, type NotifPrefs } from '../PortalData'
import { supabase } from '../../lib/supabaseClient'
import { sendInviteEmail } from '../actions'

const PREF_ROWS: { key: keyof NotifPrefs; label: string; note: string }[] = [
  { key: 'gaReminders', label: 'GA1 examination reminders', note: '30, 7 and 1 day before each thorough examination falls due' },
  { key: 'invoiceReminders', label: 'Invoice reminders', note: 'When an invoice is issued and before it falls due' },
  { key: 'quoteUpdates', label: 'Quote updates', note: 'When a new quote is ready for your approval' },
  { key: 'jobUpdates', label: 'Job & visit updates', note: 'When work is scheduled or completed' },
  { key: 'marketing', label: 'Occasional news', note: 'Service offers and seasonal reminders' },
]

const initials = (s: string) => s.split(/[@\s.]+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

export default function Settings() {
  const { data, refresh } = usePortal()
  const clientId = data.client?.id
  const [prefs, setPrefs] = useState<NotifPrefs>(data.prefs)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefMsg, setPrefMsg] = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<string | null>(null)

  const toggle = (key: keyof NotifPrefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }))

  const savePrefs = async () => {
    if (!clientId) return
    setSavingPrefs(true); setPrefMsg(null)
    const { error } = await supabase.from('client_notification_prefs').upsert({
      client_id: clientId,
      ga1_reminders: prefs.gaReminders, invoice_reminders: prefs.invoiceReminders,
      quote_updates: prefs.quoteUpdates, job_updates: prefs.jobUpdates,
      marketing: prefs.marketing, notify_email: prefs.notifyEmail || null, updated_at: new Date().toISOString(),
    })
    setPrefMsg(error ? (error.message || 'Could not save.') : 'Preferences saved.')
    setSavingPrefs(false)
    if (!error) refresh()
  }

  const invite = async () => {
    if (!clientId || !inviteEmail.trim()) return
    setInviteBusy(true); setInviteMsg(null)
    const { error } = await supabase.from('client_users').insert({ client_id: clientId, email: inviteEmail.trim(), role: inviteRole })
    if (error) { setInviteMsg(error.message || 'Could not add that person.'); setInviteBusy(false); return }
    const mail = await sendInviteEmail(inviteEmail.trim())
    setInviteMsg(mail.ok ? `Invited ${inviteEmail.trim()}.` : (mail.note || `Added ${inviteEmail.trim()} — they can sign up with this email to join.`))
    setInviteEmail('')
    setInviteBusy(false)
    refresh()
  }

  const remove = async (id: string) => {
    await supabase.from('client_users').delete().eq('id', id)
    refresh()
  }

  return (
    <>
      <h1 style={{ fontSize: 32, margin: '0 0 4px' }}>Account</h1>
      <p style={{ fontSize: 14, color: 'var(--color-neutral-700)', margin: '0 0 22px' }}>Who can see this portal, and how we get hold of you.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 22, alignItems: 'start' }}>

        {/* Notifications */}
        <div className="blueprint" style={{ padding: '18px 20px' }}>
          <h3 style={{ fontSize: 19, margin: '0 0 12px' }}>Notifications</h3>
          {PREF_ROWS.map((r) => (
            <label key={r.key} className="prow" style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '10px 4px', borderBottom: '1px solid color-mix(in srgb,var(--color-text) 8%,transparent)', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!prefs[r.key]} onChange={() => toggle(r.key)} style={{ marginTop: 3, accentColor: 'var(--color-accent)', width: 15, height: 15 }} />
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 14 }}>{r.label}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--color-neutral-700)', marginTop: 1 }}>{r.note}</span>
              </span>
            </label>
          ))}
          <div className="field" style={{ marginTop: 14 }}>
            <label>Send to</label>
            <input className="input" value={prefs.notifyEmail} onChange={(e) => setPrefs((p) => ({ ...p, notifyEmail: e.target.value }))} placeholder="you@company.ie" />
          </div>
          {prefMsg && <div style={{ fontSize: 12.5, color: 'var(--color-neutral-700)', marginTop: 10 }}>{prefMsg}</div>}
          <button className="btn btn-primary btn-block" onClick={savePrefs} disabled={savingPrefs}>{savingPrefs ? 'Saving…' : 'Save preferences'}</button>
        </div>

        <div>
          {/* People on account */}
          <div className="blueprint" style={{ padding: '18px 20px', marginBottom: 20 }}>
            <h3 style={{ fontSize: 19, margin: '0 0 10px' }}>People on this account</h3>
            {data.members.length === 0 && <p style={{ fontSize: 13, color: 'var(--color-neutral-700)', margin: '0 0 10px' }}>Just you so far. Invite a colleague to share access.</p>}
            {data.members.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderBottom: '1px solid color-mix(in srgb,var(--color-text) 8%,transparent)' }}>
                <span style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', border: '1px solid var(--color-divider)', borderRadius: 999, fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 12 }}>{initials(m.email)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--color-neutral-700)' }}>{m.linked ? m.role : `${m.role} · invite pending`}</span>
                </span>
                <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => remove(m.id)}>Remove</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              <input className="input" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@company.ie" style={{ flex: 1, minWidth: 160 }} />
              <select className="input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={{ width: 120, flex: 'none' }}>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
                <option value="owner">Owner</option>
              </select>
              <button className="btn btn-primary" onClick={invite} disabled={inviteBusy || !inviteEmail.trim()}>{inviteBusy ? 'Adding…' : 'Invite'}</button>
            </div>
            {inviteMsg && <div style={{ fontSize: 12.5, color: 'var(--color-neutral-700)', marginTop: 8 }}>{inviteMsg}</div>}
          </div>

          {/* Billing */}
          <div style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--pt-r)', padding: '16px 18px' }}>
            <h3 style={{ fontSize: 19, margin: '0 0 10px' }}>Billing</h3>
            <div style={{ fontSize: 13.5, lineHeight: 1.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--color-neutral-700)' }}>Account</span><span>{data.client?.name}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--color-neutral-700)' }}>Email</span><span>{data.client?.email || '—'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--color-neutral-700)' }}>Phone</span><span>{data.client?.phone || '—'}</span></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
