import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import AIMentorChat from '../AIMentorChat'
// Layout ready

export default function AppLayout() {
  return (
    <div className="h-screen overflow-hidden bg-[var(--color-bg)] flex flex-col">
      <Navbar />
      {/* min-h-0 is required so flex-1 doesn't overflow its parent */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <AIMentorChat />
    </div>
  )
}
