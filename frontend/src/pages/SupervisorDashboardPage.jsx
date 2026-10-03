import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { SkeletonCards } from '../components/ui/Skeleton.jsx'
import { ProjectsIcon } from '../components/dashboard/icons.jsx'
import { apiFetch } from '../utils/api.js'
import { supervisorNavItems } from '../utils/supervisorNav.js'

// Reused as-is for the contractor role (see App.jsx's /contractor route) —
// the underlying data is already role-agnostic (GET /api/projects returns
// whatever project_members this account belongs to), so only the link
// target, nav items, and copy need to vary per role.
function SupervisorDashboardPage({ basePath = '/supervisor', navItems = supervisorNavItems, subtitle = "Projects you've been added to supervise." }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiFetch('/api/projects')
        setProjects(data.projects || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <DashboardShell sidebarProps={{ navItems }}>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader
            onMenuClick={onMenuClick}
            title="Your Projects"
            subtitle={subtitle}
          />

          {error && <p className="mt-5 text-sm text-danger">{error}</p>}

          {loading ? (
            <SkeletonCards className="mt-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" />
          ) : projects.length === 0 ? (
            <EmptyState
              className="mt-8"
              icon={<ProjectsIcon className="h-6 w-6" />}
              title="No projects yet"
              description="You haven't been added to any projects yet."
            />
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
                    to={`${basePath}/projects/${project.id}`}
                    className="block rounded-2xl border border-ink/10 bg-navy-900/50 p-5 transition-colors duration-200 hover:border-gold-500/30"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10 text-accent">
                      <ProjectsIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 font-display text-sm font-semibold text-ink">{project.name}</p>
                    <p className="mt-1 text-xs text-fg-subtle">{project.location || 'No location set'}</p>
                    <p className="mt-1 text-xs text-fg-subtle">Customer: {project.customerName}</p>
                    <span className="mt-3 inline-block rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium capitalize text-success">
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
