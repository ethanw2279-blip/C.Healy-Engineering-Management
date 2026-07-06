import { Outlet } from 'react-router-dom'
import TabBar from './TabBar'
import Fab from './Fab'

export default function Layout() {
  return (
    <div className="phone">
      <div className="screen">
        <Outlet />
      </div>
      <Fab />
      <TabBar />
    </div>
  )
}
