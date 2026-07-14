import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useEffect } from 'react'
import { CloseIcon } from '../../components/Icons'
import './ui.css'

// ---- Button ----------------------------------------------------------------
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}
export function Button({ variant = 'primary', size = 'md', className = '', ...rest }: ButtonProps) {
  return <button className={`btn btn-${variant} btn-${size} ${className}`} {...rest} />
}

// ---- Avatar ----------------------------------------------------------------
export function Avatar({ name, color, size = 32 }: { name: string; color?: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      className="avatar"
      style={{ background: color ?? '#16343B', width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  )
}

// ---- StatusBadge -----------------------------------------------------------
const tone: Record<string, string> = {
  // greens
  Active: 'green', Approved: 'green', Paid: 'green', Complete: 'green', Converted: 'green', Fulfilled: 'green',
  // ambers
  'Awaiting response': 'amber', 'Awaiting payment': 'amber', Scheduled: 'amber',
  'Requires invoicing': 'amber', 'Assessment complete': 'amber', Pending: 'amber', Processing: 'amber',
  Lead: 'blue', New: 'blue',
  // greys
  Draft: 'grey', Unscheduled: 'grey', Archived: 'grey',
  // reds
  'Past due': 'red', Cancelled: 'red',
}
export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${tone[status] ?? 'grey'}`}>{status}</span>
}

// ---- Modal -----------------------------------------------------------------
export function Modal({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <CloseIcon size={22} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  )
}

// ---- Form field ------------------------------------------------------------
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

// ---- Page header -----------------------------------------------------------
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ---- Empty state -----------------------------------------------------------
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {hint && <span>{hint}</span>}
    </div>
  )
}
