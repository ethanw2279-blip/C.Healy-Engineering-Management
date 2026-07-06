import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './screens/Home'
import Schedule from './screens/Schedule'
import Timesheet from './screens/Timesheet'
import Search from './screens/Search'
import More from './screens/More'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="timesheet" element={<Timesheet />} />
        <Route path="search" element={<Search />} />
        <Route path="more" element={<More />} />
      </Route>
    </Routes>
  )
}
