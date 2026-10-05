import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient'

// In-app notifications. Rows are written by database triggers (see
// supabase/migrations/0020_notifications.sql); the apps only read them and
// mark them read. New rows stream in over Supabase Realtime.

export type AppNotification = {
  id: string
  kind: string
  title: string
  body: string
  entityType: string | null
  entityId: string | null
  count: number
  readAt: string | null
  createdAt: string
}

type Row = {
  id: string
  kind: string
  title: string
  body: string | null
  entity_type: string | null
  entity_id: string | null
  count: number | null
  read_at: string | null
  created_at: string
}

const fromRow = (r: Row): AppNotification => ({
  id: r.id,
  kind: r.kind,
  title: r.title,
  body: r.body ?? '',
  entityType: r.entity_type,
  entityId: r.entity_id,
  count: r.count ?? 1,
  readAt: r.read_at,
  createdAt: r.created_at,
})

const LIMIT = 50

/** The signed-in employee's latest notifications, kept live. */
export function useNotifications(employeeId: string | undefined) {
  const [items, setItems] = useState<AppNotification[]>([])
  const enabled = isSupabaseConfigured && !!employeeId

  const load = useCallback(async () => {
    if (!enabled) return
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', employeeId!)
      .order('created_at', { ascending: false })
      .limit(LIMIT)
    // Before migration 0020 runs the table doesn't exist; just show nothing.
    if (!error) setItems((data as Row[]).map(fromRow))
  }, [enabled, employeeId])

  useEffect(() => {
    if (!enabled) {
      setItems([])
      return
    }
    load()
    const channel = supabase
      .channel(`notifications:${employeeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${employeeId}` },
        () => load(),
      )
      .subscribe()
    // Catch up after the phone wakes or the tab regains focus.
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      supabase.removeChannel(channel)
    }
  }, [enabled, employeeId, load])

  const markRead = useCallback(async (id: string) => {
    const now = new Date().toISOString()
    setItems((xs) => xs.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: now } : n)))
    await supabase.from('notifications').update({ read_at: now }).eq('id', id).is('read_at', null)
  }, [])

  const markAllRead = useCallback(async () => {
    if (!enabled) return
    const now = new Date().toISOString()
    setItems((xs) => xs.map((n) => (n.readAt ? n : { ...n, readAt: now })))
    await supabase.from('notifications').update({ read_at: now }).eq('recipient_id', employeeId!).is('read_at', null)
  }, [enabled, employeeId])

  return {
    items,
    unread: items.filter((n) => !n.readAt).length,
    enabled,
    markRead,
    markAllRead,
  }
}

export type NotificationApp = 'field' | 'office'

/** Where tapping a notification goes, in each app. */
export function notificationHref(n: AppNotification, app: NotificationApp): string | null {
  const id = n.entityId
  if (app === 'field') {
    switch (n.entityType) {
      case 'job': return id ? `/field/job/${id}` : '/field/jobs'
      case 'ga1': return id ? `/field/ga1/${id}` : '/field/ga1'
      case 'timesheet': return '/field/timesheet'
      case 'schedule': return '/field/schedule'
      case 'stock': return id ? `/field/stock?loc=${id}` : '/field/stock'
      case 'shopping': return '/field/shopping'
      default: return null
    }
  }
  switch (n.entityType) {
    case 'job': return id ? `/jobs/${id}` : '/jobs'
    case 'ga1': return id ? `/ga1/${id}` : '/ga1'
    case 'request': return id ? `/requests/${id}` : '/requests'
    case 'quote': return id ? `/quotes/${id}` : '/quotes'
    case 'invoice': return id ? `/invoices/${id}` : '/invoices'
    case 'order': return id ? `/shop/orders/${id}` : '/shop/orders'
    case 'timesheet': return '/timesheets'
    case 'schedule': return '/schedule'
    case 'stock': return id ? `/stock?loc=${id}` : '/stock'
    case 'shopping': return '/stock'
    default: return null
  }
}

/** "now", "5m", "3h", "2d", then a short date. */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`
  return new Date(iso).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })
}

/** The notification types a person can switch on/off, and who sees each. */
export const NOTIFICATION_TYPES: { label: string; kinds: string[]; perm?: string }[] = [
  { label: 'Assigned to a job', kinds: ['job_assigned'] },
  { label: 'New visits on my schedule', kinds: ['visit_added'] },
  { label: 'My hours approved', kinds: ['time_approved'] },
  { label: 'Hours waiting for approval', kinds: ['time_submitted'], perm: 'approve:timesheets' },
  { label: 'Photos & files uploaded', kinds: ['photo_added', 'file_added'], perm: 'create:records' },
  { label: 'New GA1 reports', kinds: ['ga1_created'], perm: 'create:records' },
  { label: 'Jobs marked complete', kinds: ['job_completed'], perm: 'create:records' },
  { label: 'Quotes approved', kinds: ['quote_approved'], perm: 'create:records' },
  { label: 'New requests', kinds: ['request_created'], perm: 'view:requests' },
  { label: 'Website & portal orders', kinds: ['order_created'], perm: 'view:shop' },
  { label: 'Invoices paid', kinds: ['invoice_paid'], perm: 'view:invoices' },
  { label: 'Stock running low or out', kinds: ['stock_low', 'stock_out'], perm: 'view:stock' },
  { label: 'Materials to buy for jobs', kinds: ['materials_to_buy'], perm: 'create:records' },
]

export type NotificationChannel = 'app' | 'push'

/** The signed-in employee's notification settings (all on by default). */
export function useNotificationPrefs(employeeId: string | undefined) {
  const [offKinds, setOffKinds] = useState<string[]>([])
  const [noPushKinds, setNoPushKinds] = useState<string[]>([])
  const enabled = isSupabaseConfigured && !!employeeId

  useEffect(() => {
    if (!enabled) return
    supabase
      .from('notification_prefs')
      .select('off_kinds, no_push_kinds')
      .eq('employee_id', employeeId!)
      .maybeSingle()
      .then(({ data }) => {
        setOffKinds(data?.off_kinds ?? [])
        setNoPushKinds(data?.no_push_kinds ?? [])
      })
  }, [enabled, employeeId])

  /** Turn a group of kinds on or off for one channel, and save. */
  const setKinds = useCallback(
    async (kinds: string[], channel: NotificationChannel, on: boolean) => {
      const apply = (xs: string[]) =>
        on ? xs.filter((k) => !kinds.includes(k)) : [...new Set([...xs, ...kinds])]
      const nextOff = channel === 'app' ? apply(offKinds) : offKinds
      const nextNoPush = channel === 'push' ? apply(noPushKinds) : noPushKinds
      setOffKinds(nextOff)
      setNoPushKinds(nextNoPush)
      if (!enabled) return
      const { error } = await supabase.from('notification_prefs').upsert({
        employee_id: employeeId,
        off_kinds: nextOff,
        no_push_kinds: nextNoPush,
        updated_at: new Date().toISOString(),
      })
      if (error) alert('Could not save notification settings.')
    },
    [enabled, employeeId, offKinds, noPushKinds],
  )

  const isOn = (kinds: string[], channel: NotificationChannel) =>
    !kinds.some((k) => (channel === 'app' ? offKinds : noPushKinds).includes(k))

  return { isOn, setKinds }
}
