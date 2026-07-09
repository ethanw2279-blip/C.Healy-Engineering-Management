import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Sends web-push notifications to a set of employees. Called from the app when,
// e.g., a crew member is assigned to a job. Uses the service-role key to read
// every matching subscription regardless of row-level security.
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY
const vapidPrivate = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  if (!url || !serviceKey || !vapidPublic || !vapidPrivate) {
    return res.status(500).json({
      error: 'Push not configured. Set VAPID_PRIVATE_KEY, VITE_VAPID_PUBLIC_KEY, SUPABASE_SERVICE_ROLE_KEY.',
    })
  }

  // Require a valid Supabase session so this can't be called anonymously.
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing bearer token' })

  const authed = createClient(url, anonKey || serviceKey, { auth: { persistSession: false } })
  const { data: userData, error: userErr } = await authed.auth.getUser(token)
  if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid session' })

  const { employeeIds, title, body, url: clickUrl } = req.body || {}
  if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
    return res.status(400).json({ error: 'employeeIds required' })
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data: subs, error } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('employee_id', employeeIds)
  if (error) return res.status(500).json({ error: error.message })

  const notification = JSON.stringify({
    title: title || 'C.Healy Engineering',
    body: body || '',
    url: clickUrl || '/field',
  })

  let sent = 0
  const stale = []
  await Promise.all(
    (subs || []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          notification,
        )
        sent++
      } catch (err) {
        // 404/410 mean the subscription is gone — clean it up.
        if (err?.statusCode === 404 || err?.statusCode === 410) stale.push(s.endpoint)
      }
    }),
  )

  if (stale.length) {
    await admin.from('push_subscriptions').delete().in('endpoint', stale)
  }

  return res.status(200).json({ sent, removed: stale.length })
}
