import { Routes, Route } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Requests from './pages/Requests'
import RequestDetail from './pages/RequestDetail'
import Quotes from './pages/Quotes'
import QuoteDetail from './pages/QuoteDetail'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Invoices from './pages/Invoices'
import InvoiceDetail from './pages/InvoiceDetail'
import Timesheets from './pages/Timesheets'
import GA1List from './pages/GA1List'
import GA1Detail from './pages/GA1Detail'
import GA1Form from './pages/GA1Form'
import Team from './pages/Team'
import Roles from './pages/Roles'
import Reports from './pages/Reports'
import PrintDocument from './pages/PrintDocument'
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
        <Route path="clients/:id" element={guard('view:clients', <ClientDetail />)} />
        <Route path="requests" element={guard('view:requests', <Requests />)} />
        <Route path="requests/:id" element={guard('view:requests', <RequestDetail />)} />
        <Route path="quotes" element={guard('view:quotes', <Quotes />)} />
        <Route path="quotes/:id" element={guard('view:quotes', <QuoteDetail />)} />
        <Route path="jobs" element={guard('view:jobs', <Jobs />)} />
        <Route path="jobs/:id" element={guard('view:jobs', <JobDetail />)} />
        <Route path="invoices" element={guard('view:invoices', <Invoices />)} />
        <Route path="invoices/:id" element={guard('view:invoices', <InvoiceDetail />)} />
        <Route path="timesheets" element={guard('view:timesheets', <Timesheets />)} />
        <Route path="ga1" element={guard('view:ga1', <GA1List />)} />
        <Route path="ga1/new" element={guard('create:records', <GA1Form />)} />
        <Route path="ga1/:id" element={guard('view:ga1', <GA1Detail />)} />
        <Route path="ga1/:id/edit" element={guard('create:records', <GA1Form />)} />
        <Route path="team" element={guard('view:team', <Team />)} />
        <Route path="roles" element={guard('manage:roles', <Roles />)} />
        <Route path="reports" element={guard('view:reports', <Reports />)} />
        <Route path="no-access" element={<NoAccess />} />
      </Route>

      {/* Standalone print/PDF documents — no sidebar chrome. */}
      <Route path="quotes/:id/print" element={guard('view:quotes', <PrintDocument kind="quote" />)} />
      <Route path="invoices/:id/print" element={guard('view:invoices', <PrintDocument kind="invoice" />)} />
    </Routes>
  )
}
