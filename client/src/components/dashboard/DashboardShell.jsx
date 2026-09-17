import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './Sidebar.jsx'
import DashboardBackground from './DashboardBackground.jsx'

function DashboardShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="relative flex min-h-screen w-full bg-navy-950">
      <DashboardBackground />

      <div className="relative z-10 hidden lg:flex">
        <Sidebar />
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-40 lg:hidden"
            >
              <Sidebar onClose={() => setDrawerOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex-1 px-5 py-6 sm:px-8 sm:py-8">
        {typeof children === 'function' ? children({ onMenuClick: () => setDrawerOpen(true) }) : children}
      </main>
    </div>
  )
}

export default DashboardShell
