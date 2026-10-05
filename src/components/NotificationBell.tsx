import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellIcon } from './Icons'
import { useCurrentUser } from '../data/store'
import { useOutsideClose } from '../admin/useOutsideClose'
import {
  useNotifications,
  notificationHref,
  timeAgo,
  type AppNotification,
  type NotificationApp,
} from '../lib/notifications'
import './NotificationBell.css'

type Props = {
  /** Which app's routes notifications open, and how the panel is laid out. */
  app: NotificationApp
  /** Class for the bell button, so it matches the header it sits in. */
  buttonClassName: string
  iconSize?: number
}

// Bell with an unread badge. Opens a dropdown in the office app and a
// full-screen sheet in the field app.
export default function NotificationBell({ app, buttonClassName, iconSize = 22 }: Props) {
  const { user } = useCurrentUser()
  const { items, unread, enabled, markRead, markAllRead } = useNotifications(user?.id)
  const [open, setOpen] = useState(false)
  const ref = useOutsideClose<HTMLDivElement>(open, () => setOpen(false))
  const nav = useNavigate()

  const openItem = (n: AppNotification) => {
    if (!n.readAt) markRead(n.id)
    const href = notificationHref(n, app)
    setOpen(false)
    if (href) nav(href)
  }

  return (
    <div className={`nb nb-${app}`} ref={ref}>
      <button
        className={`${buttonClassName} nb-btn`}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <BellIcon size={iconSize} />
        {unread > 0 && <span className="nb-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="nb-panel" role="dialog" aria-label="Notifications">
          <div className="nb-head">
            <span className="nb-title">Notifications</span>
            <div className="nb-head-actions">
              {unread > 0 && (
                <button className="nb-link" onClick={markAllRead}>Mark all read</button>
              )}
              {app === 'field' && (
                <button className="nb-link" onClick={() => setOpen(false)}>Close</button>
              )}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="nb-empty">
              {enabled ? "You're all caught up." : 'Notifications appear here once the app is connected to Supabase.'}
            </div>
          ) : (
            <ul className="nb-list">
              {items.map((n) => (
                <li key={n.id}>
                  <button className={`nb-item ${n.readAt ? '' : 'unread'}`} onClick={() => openItem(n)}>
                    <span className="nb-dot" aria-hidden />
                    <span className="nb-text">
                      <strong>{n.title}</strong>
                      {n.body && <span>{n.body}</span>}
                    </span>
                    <time className="nb-time" dateTime={n.createdAt}>{timeAgo(n.createdAt)}</time>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
