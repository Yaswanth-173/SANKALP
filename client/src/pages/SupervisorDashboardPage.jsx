import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import Spinner from '../components/Spinner.jsx'
import { ProjectsIcon } from '../components/dashboard/icons.jsx'
import { apiFetch } from '../utils/api.js'
import { supervisorNavItems } from '../utils/supervisorNav.js'

function SupervisorDashboardPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiFetch('/api/projects')
        setProjects(data.projects)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <DashboardShell sidebarProps={{ navItems: supervisorNavItems, showLocationPicker: false }}>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader
            onMenuClick={onMenuClick}
            title="Your Projects"
            subtitle="Projects you've been added to supervise."
          />

          {error && <p className="mt-5 text-sm text-red-400">{error}</p>}

          {loading ? (
            <div className="mt-16 flex justify-center">
              <Spinner className="h-6 w-6 text-ink/40" />
            </div>
          ) : projects.length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-3 text-center text-ink/40">
              <ProjectsIcon className="h-10 w-10" />
              <p className="text-sm">You haven't been added to any projects yet.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3) }}
                >
                  <Link
                    to={`/supervisor/projects/${project.id}`}
                    className="block rounded-2xl border border-ink/10 bg-navy-900/50 p-5 transition-colors duration-200 hover:border-gold-500/30"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10 text-gold-300">
                      <ProjectsIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 font-display text-sm font-semibold text-ink">{project.name}</p>
                    <p className="mt-1 text-xs text-ink/45">{project.location || 'No location set'}</p>
                    <p className="mt-1 text-xs text-ink/45">Customer: {project.customerName}</p>
                    <span className="mt-3 inline-block rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium capitalize text-emerald-300">
                      {project.status}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardShell>
  )
}

export default SupervisorDashboardPage
