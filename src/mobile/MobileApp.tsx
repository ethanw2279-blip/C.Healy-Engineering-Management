import { Routes, Route } from 'react-router-dom'
import Layout from '../components/Layout'
import Home from '../screens/Home'
import Schedule from '../screens/Schedule'
import Timesheet from '../screens/Timesheet'
import Search from '../screens/Search'
import More from '../screens/More'

// The field-crew mobile app, mounted under /field. It keeps the clock in/out
// flow, which belongs to on-site staff (not the office admin).
export default function MobileApp() {
  return (
    <div className="mobile-shell">
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="timesheet" element={<Timesheet />} />
          <Route path="search" element={<Search />} />
          <Route path="more" element={<More />} />
        </Route>
      </Routes>
    </div>
  )
}
