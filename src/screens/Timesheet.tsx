import ScreenHeader from '../components/ScreenHeader'
import { ClockIcon } from '../components/Icons'
import './screens.css'

export default function Timesheet() {
  return (
    <div>
      <ScreenHeader title="Timesheet" />
      <div className="placeholder">
        <ClockIcon size={48} />
        <h2>Total completed time 00:00</h2>
        <p>Clock in from the Home tab to start tracking time against your jobs.</p>
      </div>
    </div>
  )
}
