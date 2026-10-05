import type { ReactNode } from 'react'
import { Modal } from '../admin/components/ui'
import '../screens/field.css'
import './stock.css'

// A bottom sheet in the field app, or the same form in a centred modal in the
// office app, so the stock forms are written once.
export default function SheetOrModal({ title, inModal, onClose, children }: { title: string; inModal?: boolean; onClose: () => void; children: ReactNode }) {
  if (inModal) return <Modal title={title} onClose={onClose}><div className="stk-modal-form">{children}</div></Modal>
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">{title}</h2>
        {children}
      </div>
    </div>
  )
}
