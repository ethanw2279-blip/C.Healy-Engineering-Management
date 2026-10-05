import { useEffect, useState } from 'react'
import { useCurrentUser } from '../data/store'
import { NOTIFICATION_TYPES, useNotificationPrefs } from '../lib/notifications'
import { isPushConfigured, isSubscribed, subscribe, unsubscribe } from '../lib/push'

function Switch({ on, disabled, label, onChange }: { on: boolean; disabled?: boolean; label: string; onChange: (on: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      className={`nb-switch ${on ? 'on' : ''}`}
      onClick={() => onChange(!on)}
    >
      <span />
    </button>
  )
}

// Lets each person pick which notifications they get, in the app and as a
// push to their phone, and turn push on for this device.
export default function NotificationSettings() {
  const { user, can } = useCurrentUser()
  const { isOn, setKinds } = useNotificationPrefs(user?.id)
  const [deviceOn, setDeviceOn] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isPushConfigured) isSubscribed().then(setDeviceOn)
  }, [])

  const toggleDevice = async () => {
    if (!user || busy) return
    setBusy(true)
    try {
      if (deviceOn) {
        await unsubscribe()
        setDeviceOn(false)
      } else {
        await subscribe(user.id)
        setDeviceOn(true)
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not update push notifications.')
    } finally {
      setBusy(false)
    }
  }

  const types = NOTIFICATION_TYPES.filter((t) => !t.perm || can(t.perm))

  return (
    <div className="nb-settings">
      {isPushConfigured ? (
        <div className="nb-set-row nb-set-device">
          <span className="nb-set-label">
            <strong>Push to this device</strong>
            <span>{deviceOn ? 'This phone or browser will buzz for the types below marked Phone.' : 'Turn on to get alerts even when the app is closed.'}</span>
          </span>
          <Switch on={deviceOn} disabled={busy} label="Push to this device" onChange={toggleDevice} />
        </div>
      ) : (
        <p className="nb-set-note">Phone push isn't available on this device. On iPhone, add the app to your Home Screen first.</p>
      )}

      <div className="nb-set-row nb-set-head">
        <span className="nb-set-label" />
        <span className="nb-set-col">App</span>
        <span className="nb-set-col">Phone</span>
      </div>
      {types.map((t) => {
        const appOn = isOn(t.kinds, 'app')
        return (
          <div className="nb-set-row" key={t.label}>
            <span className="nb-set-label"><strong>{t.label}</strong></span>
            <Switch on={appOn} label={`${t.label} in the app`} onChange={(on) => setKinds(t.kinds, 'app', on)} />
            <Switch
              on={appOn && isOn(t.kinds, 'push')}
              disabled={!appOn}
              label={`${t.label} on my phone`}
              onChange={(on) => setKinds(t.kinds, 'push', on)}
            />
          </div>
        )
      })}
    </div>
  )
}
