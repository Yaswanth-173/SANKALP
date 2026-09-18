import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import Spinner from '../components/Spinner.jsx'
import { BackArrowIcon } from '../components/dashboard/icons.jsx'
import { apiFetch } from '../utils/api.js'
import { supervisorNavItems } from '../utils/supervisorNav.js'

function SupervisorProjectDetailPage({ basePath = '/supervisor', navItems = supervisorNavItems }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiFetch(`/api/projects/${id}`)
        setProject(data.project)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  return (
    <DashboardShell sidebarProps={{ navItems, showLocationPicker: false }}>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader
            onMenuClick={onMenuClick}
            title={project?.name || 'Project'}
            subtitle={project ? `Customer: ${project.customerName}` : ''}
          />

          <button
            onClick={() => navigate(basePath)}
            className="mt-4 flex items-center gap-1.5 text-xs font-medium text-ink/50 hover:text-ink"
          >
            <BackArrowIcon className="h-3.5 w-3.5" /> All projects
          </button>

          {error && <p className="mt-5 text-sm text-red-400">{error}</p>}

          {loading ? (
            <div className="mt-16 flex justify-center">
              <Spinner className="h-6 w-6 text-ink/40" />
            </div>
          ) : project ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-ink/10 bg-navy-900/50 p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-ink/40">Location</p>
                <p className="mt-1 text-sm text-ink/90">{project.location || 'Not set'}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-wider text-ink/40">Status</p>
                <span className="mt-1 inline-block rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium capitalize text-emerald-300">
                  {project.status}
                </span>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-navy-900/50 p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-ink/40">Team</p>
                <div className="mt-2 space-y-2">
                  {project.members?.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-xl border border-ink/10 bg-navy-950/40 px-4 py-2.5">
                      <div>
                        <p className="text-sm text-ink/90">{m.fullName}</p>
                        <p className="text-xs text-ink/40">{m.email}</p>
                      </div>
                      <span className="rounded-full bg-gold-500/10 px-2.5 py-1 text-[10px] font-medium capitalize text-gold-300">
                        {m.roleOnProject}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </DashboardShell>
  )
}

export default SupervisorProjectDetailPage
