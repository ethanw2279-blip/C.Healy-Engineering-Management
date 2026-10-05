import { supabase, isSupabaseConfigured } from './supabaseClient'

// Web Push helpers. Subscribing stores the browser's push subscription in
// Supabase so the server (api/notify) can reach this device. Pushes are sent
// by the database whenever a notification is created.

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

/** True when push is available and a VAPID public key is configured. */
export const isPushConfigured =
  isSupabaseConfigured &&
  !!VAPID_PUBLIC_KEY &&
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

/** Whether this device currently has an active push subscription. */
export async function isSubscribed(): Promise<boolean> {
  if (!isPushConfigured) return false
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  return !!sub
}

/** Prompt for permission and register this device against the given employee. */
export async function subscribe(employeeId: string): Promise<void> {
  if (!isPushConfigured) throw new Error('Push is not available on this device.')
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('Notification permission was declined.')

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
    })
  }

  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      employee_id: employeeId,
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw error
}

/** Remove this device's subscription (locally and in the database). */
export async function unsubscribe(): Promise<void> {
  if (!isPushConfigured) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}
