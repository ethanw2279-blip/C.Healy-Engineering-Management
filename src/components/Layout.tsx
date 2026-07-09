import { Outlet } from 'react-router-dom'
import TabBar from './TabBar'
import Fab from './Fab'
import { useOnline } from '../data/offline'
import './Layout.css'

export default function Layout() {
  const online = useOnline()
  return (
    <div className="phone">
      {!online && <div className="offline-banner">Offline — changes will sync when you're back on signal</div>}
      <div className="screen">
        <Outlet />
      </div>
      <Fab />
      <TabBar />
    </div>
  )
}
