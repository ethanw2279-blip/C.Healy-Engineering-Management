import { Routes, Route } from 'react-router-dom'
import Layout from '../components/Layout'
import Home from '../screens/Home'
import Schedule from '../screens/Schedule'
import Timesheet from '../screens/Timesheet'
import Search from '../screens/Search'
import More from '../screens/More'
import JobView from '../screens/JobView'
import FieldClients from '../screens/FieldClients'
import FieldJobs from '../screens/FieldJobs'
import FieldGA1 from '../screens/FieldGA1'
import FieldGA1Detail from '../screens/FieldGA1Detail'
import FieldGA1Form from '../screens/FieldGA1Form'

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
          <Route path="job/:id" element={<JobView />} />
          <Route path="clients" element={<FieldClients />} />
          <Route path="jobs" element={<FieldJobs />} />
          <Route path="ga1" element={<FieldGA1 />} />
          <Route path="ga1/new" element={<FieldGA1Form />} />
          <Route path="ga1/:id" element={<FieldGA1Detail />} />
          <Route path="ga1/:id/edit" element={<FieldGA1Form />} />
        </Route>
      </Routes>
    </div>
  )
}
