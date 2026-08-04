import { usePortalNav } from '../PortalNav'

// On-brand placeholder for screens whose backend lands in a later stage. Not a
// dead end — it routes the user to something useful.
export default function ComingSoon({ title, blurb }: { title: string; blurb: string }) {
  const { go } = usePortalNav()
  return (
    <div style={{ maxWidth: 560, margin: '30px auto 0', textAlign: 'center' }}>
      <div className="blueprint" style={{ padding: '34px 28px' }}>
        <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-accent-700)', marginBottom: 8 }}>Coming soon</div>
        <h1 style={{ fontSize: 30, margin: '0 0 8px' }}>{title}</h1>
        <p style={{ fontSize: 14, color: 'var(--color-neutral-700)', margin: '0 0 20px', lineHeight: 1.55 }}>{blurb}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => go('request')}>Request work</button>
          <button className="btn btn-primary" onClick={() => go('home')}>Back to overview</button>
        </div>
      </div>
    </div>
  )
}
