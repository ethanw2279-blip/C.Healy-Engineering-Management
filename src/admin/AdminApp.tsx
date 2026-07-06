import { Routes, Route } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import Clients from './pages/Clients'
import Requests from './pages/Requests'
import Quotes from './pages/Quotes'
import Jobs from './pages/Jobs'
import Invoices from './pages/Invoices'
import Timesheets from './pages/Timesheets'
import Team from './pages/Team'
import Reports from './pages/Reports'

export default function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="clients" element={<Clients />} />
        <Route path="requests" element={<Requests />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="timesheets" element={<Timesheets />} />
        <Route path="team" element={<Team />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  )
}
