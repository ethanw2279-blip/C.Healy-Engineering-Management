import { Routes, Route } from 'react-router-dom'
import AdminApp from './admin/AdminApp'
import MobileApp from './mobile/MobileApp'

export default function App() {
  return (
    <Routes>
      {/* Field-crew mobile app */}
      <Route path="/field/*" element={<MobileApp />} />
      {/* Office admin web app (default) */}
      <Route path="/*" element={<AdminApp />} />
    </Routes>
  )
}
