import { useState } from 'react'
import Sidebar from './Sidebar.jsx'
import DashboardBackground from './DashboardBackground.jsx'
import Modal from '../ui/Modal.jsx'

// `sidebarProps` is forwarded to Sidebar so other roles' shells can swap in
// their own nav items without duplicating this whole layout.
function DashboardShell({ children, sidebarProps }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="relative flex min-h-svh w-full bg-canvas">
      <DashboardBackground />

      <div className="relative z-10 hidden lg:flex">
        <Sidebar {...sidebarProps} />
      </div>

      <Modal open={drawerOpen} onClose={() => setDrawerOpen(false)} placement="left" label="Menu" className="h-full lg:hidden">
        <Sidebar {...sidebarProps} onClose={() => setDrawerOpen(false)} />
      </Modal>

      <main id="main" className="relative z-10 min-w-0 flex-1 px-4 py-5 sm:px-8 sm:py-8">
        <div className="mx-auto w-full max-w-[90rem]">
          {typeof children === 'function' ? children({ onMenuClick: () => setDrawerOpen(true) }) : children}
        </div>
      </main>
    </div>
  )
}

export default DashboardShell
