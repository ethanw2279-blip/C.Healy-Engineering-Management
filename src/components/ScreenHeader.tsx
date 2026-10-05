import NotificationBell from './NotificationBell'
import './ScreenHeader.css'

type Props = {
  /** Large centered page title (e.g. "More", "Search"). */
  title?: string
  /** Small muted line above content (e.g. the date). */
  eyebrow?: string
  /** Show the notification bell. */
  showBell?: boolean
}

export default function ScreenHeader({ title, eyebrow, showBell }: Props) {
  return (
    <header className="sh">
      {(eyebrow || showBell) && (
        <div className="sh-row">
          {eyebrow ? <span className="sh-eyebrow">{eyebrow}</span> : <span />}
          {showBell && (
            <div className="sh-actions">
              <NotificationBell app="field" buttonClassName="sh-icon-btn" />
            </div>
          )}
        </div>
      )}
      {title && <h1 className="sh-title">{title}</h1>}
    </header>
  )
}
