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
import Roles from './pages/Roles'
import Reports from './pages/Reports'
import { RequirePermission, NoAccess } from './components/RequirePermission'
import type { PermissionKey } from '../data/permissions'
import type { ReactNode } from 'react'

const guard = (perm: PermissionKey, el: ReactNode) => (
  <RequirePermission perm={perm}>{el}</RequirePermission>
)

export default function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={guard('view:dashboard', <Dashboard />)} />
        <Route path="schedule" element={guard('view:schedule', <Schedule />)} />
        <Route path="clients" element={guard('view:clients', <Clients />)} />
        <Route path="requests" element={guard('view:requests', <Requests />)} />
        <Route path="quotes" element={guard('view:quotes', <Quotes />)} />
        <Route path="jobs" element={guard('view:jobs', <Jobs />)} />
        <Route path="invoices" element={guard('view:invoices', <Invoices />)} />
        <Route path="timesheets" element={guard('view:timesheets', <Timesheets />)} />
        <Route path="team" element={guard('view:team', <Team />)} />
        <Route path="roles" element={guard('manage:roles', <Roles />)} />
        <Route path="reports" element={guard('view:reports', <Reports />)} />
        <Route path="no-access" element={<NoAccess />} />
      </Route>
    </Routes>
  )
}
