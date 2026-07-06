import { BellIcon, SparkleIcon } from './Icons'
import './ScreenHeader.css'

type Props = {
  /** Large centered page title (e.g. "More", "Search"). */
  title?: string
  /** Small muted line above content (e.g. the date). */
  eyebrow?: string
  /** Show the notification bell alongside the AI sparkle button. */
  showBell?: boolean
}

export default function ScreenHeader({ title, eyebrow, showBell }: Props) {
  return (
    <header className="sh">
      <div className="sh-row">
        {eyebrow ? <span className="sh-eyebrow">{eyebrow}</span> : <span />}
        <div className="sh-actions">
          {showBell && (
            <button className="sh-icon-btn" aria-label="Notifications">
              <BellIcon size={22} />
            </button>
          )}
          <button className="sh-icon-btn sh-ai" aria-label="AI assistant">
            <SparkleIcon size={20} />
          </button>
        </div>
      </div>
      {title && <h1 className="sh-title">{title}</h1>}
    </header>
  )
}
