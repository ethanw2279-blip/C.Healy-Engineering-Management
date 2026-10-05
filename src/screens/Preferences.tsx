import { useNavigate } from 'react-router-dom'
import NotificationSettings from '../components/NotificationSettings'
import './field.css'

// Field app → More → Preferences. Home for each person's notification
// settings (which types they get, in the app and on their phone).
export default function Preferences() {
  const nav = useNavigate()
  return (
    <div>
      <div className="fld-topbar">
        <div className="fld-topbar-left">
          <button className="fld-back" onClick={() => nav(-1)} aria-label="Back">←</button>
          <span>Preferences</span>
        </div>
      </div>

      <h2 className="prefs-section">Notifications</h2>
      <NotificationSettings />
    </div>
  )
}
