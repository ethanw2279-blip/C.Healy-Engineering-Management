import ScreenHeader from '../components/ScreenHeader'
import { CalendarIcon } from '../components/Icons'
import './screens.css'

export default function Schedule() {
  return (
    <div>
      <ScreenHeader title="Schedule" />
      <div className="placeholder">
        <CalendarIcon size={48} />
        <h2>No visits scheduled</h2>
        <p>Jobs and visits you schedule will show up here on a calendar.</p>
      </div>
    </div>
  )
}
