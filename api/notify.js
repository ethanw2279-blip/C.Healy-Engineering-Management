import crypto from 'node:crypto'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Pushes one in-app notification to its recipient's phones/browsers. Called by
// the database (pg_net, see supabase/migrations/0021_notification_prefs_push.sql)
// whenever a notification row is created, authenticated with a shared secret.
// Uses the service-role key to read the notification, the recipient's
// settings and their push subscriptions regardless of row-level security.
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY
const vapidPrivate = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'
const webhookSecret = process.env.NOTIFY_WEBHOOK_SECRET

// Kinds meant for field crew open in the field app; the rest in the office app.
const FIELD_KINDS = new Set(['job_assigned', 'visit_added', 'time_approved'])

function hrefFor(n) {
  const id = n.entity_id
  if (FIELD_KINDS.has(n.kind)) {
    switch (n.entity_type) {
      case 'job': return id ? `/field/job/${id}` : '/field/jobs'
      case 'timesheet': return '/field/timesheet'
      case 'schedule': return '/field/schedule'
      default: return '/field'
    }
  }
  switch (n.entity_type) {
    case 'job': return id ? `/jobs/${id}` : '/jobs'
    case 'ga1': return id ? `/ga1/${id}` : '/ga1'
    case 'request': return id ? `/requests/${id}` : '/requests'
    case 'quote': return id ? `/quotes/${id}` : '/quotes'
    case 'invoice': return id ? `/invoices/${id}` : '/invoices'
    case 'order': return id ? `/shop/orders/${id}` : '/shop/orders'
    case 'timesheet': return '/timesheets'
    case 'schedule': return '/schedule'
    default: return '/'
  }
}

function secretMatches(given) {
  if (!webhookSecret || typeof given !== 'string') return false
  const a = Buffer.from(given)
  const b = Buffer.from(webhookSecret)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  if (!url || !serviceKey || !vapidPublic || !vapidPrivate || !webhookSecret) {
    return res.status(500).json({
      error: 'Push not configured. Set VAPID_PRIVATE_KEY, VITE_VAPID_PUBLIC_KEY, SUPABASE_SERVICE_ROLE_KEY, NOTIFY_WEBHOOK_SECRET.',
    })
  }
  if (!secretMatches(req.headers['x-notify-secret'])) return res.status(401).json({ error: 'Bad secret' })

  const { notificationId } = req.body || {}
  if (!notificationId) return res.status(400).json({ error: 'notificationId required' })

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data: n, error: nErr } = await admin
    .from('notifications')
    .select('id, recipient_id, kind, title, body, entity_type, entity_id')
    .eq('id', notificationId)
    .maybeSingle()
  if (nErr) return res.status(500).json({ error: nErr.message })
  if (!n) return res.status(404).json({ error: 'Notification not found' })

  const { data: prefs } = await admin
    .from('notification_prefs')
    .select('no_push_kinds')
    .eq('employee_id', n.recipient_id)
    .maybeSingle()
  if (prefs?.no_push_kinds?.includes(n.kind)) return res.status(200).json({ sent: 0, muted: true })

  const { data: subs, error } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('employee_id', n.recipient_id)
  if (error) return res.status(500).json({ error: error.message })

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)
  const payload = JSON.stringify({ title: n.title, body: n.body || '', url: hrefFor(n), tag: n.id })

  let sent = 0
  const stale = []
  await Promise.all(
    (subs || []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
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
