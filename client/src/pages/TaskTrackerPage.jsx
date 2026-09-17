import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import Spinner from '../components/Spinner.jsx'
import AddTaskModal from '../components/tasks/AddTaskModal.jsx'
import TaskDetailModal from '../components/tasks/TaskDetailModal.jsx'
import ProgressRing from '../components/tasks/ProgressRing.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  TYPE_CONFIG,
  PRIORITY_CONFIG,
  PendingIcon,
  InProgressIcon,
  CompletedIcon,
  ArrowRightSmallIcon,
  ChevronRightSmallIcon,
  PlusIcon,
  BuildingIcon,
  InfoIcon,
} from '../components/tasks/taskIcons.jsx'
import { apiFetch } from '../utils/api.js'

const COLUMNS = [
  {
    status: 'pending',
    label: 'Pending Requests',
    description: 'Requests submitted and waiting to be started.',
    icon: PendingIcon,
    dateKey: 'createdAt',
    dateLabel: 'Submitted On',
    personLabel: 'Submitted By',
    ring: 'border-orange-400/60 text-orange-300',
    text: 'text-orange-300',
  },
  {
    status: 'in_progress',
    label: 'In Progress Requests',
    description: 'Requests that are currently being worked on.',
    icon: InProgressIcon,
    dateKey: 'startedAt',
    dateLabel: 'Started On',
    personLabel: 'Assigned To',
    ring: 'border-blue-400/60 text-blue-300',
    text: 'text-blue-300',
  },
  {
    status: 'completed',
    label: 'Completed Requests',
    description: 'Requests that have been completed.',
    icon: CompletedIcon,
    dateKey: 'completedAt',
    dateLabel: 'Completed On',
    personLabel: 'Completed By',
    ring: 'border-emerald-400/60 text-emerald-300',
    text: 'text-emerald-300',
  },
]

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function TaskTrackerPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTask, setActiveTask] = useState(null)
  const [projectFilter, setProjectFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiFetch('/api/tasks')
        setTasks(data.tasks)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const projectNames = useMemo(
    () => [...new Set(tasks.map((t) => t.projectName).filter(Boolean))],
    [tasks]
  )

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (projectFilter !== 'all' && t.projectName !== projectFilter) return false
      if (dateFrom && new Date(t.createdAt) < new Date(dateFrom)) return false
      if (dateTo && new Date(t.createdAt) > new Date(`${dateTo}T23:59:59`)) return false
      return true
    })
  }, [tasks, projectFilter, dateFrom, dateTo])

  const currentProject = projectFilter !== 'all' ? projectFilter : projectNames[0] || null

  const handleCreate = async (payload) => {
    const data = await apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(payload) })
    setTasks((prev) => [data.task, ...prev])
  }

  const handleAdvance = async (task, nextStatus) => {
    const data = await apiFetch(`/api/tasks/${task.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    })
    setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)))
    setActiveTask(data.task)
  }

  const handleDelete = async (id) => {
    await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setActiveTask(null)
  }

  const firstName = user?.fullName?.split(' ')[0] || 'there'

  return (
    <DashboardShell>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader
            onMenuClick={onMenuClick}
            title="Work Status Overview"
            subtitle="Track the progress of your requests and work updates in one place."
          />

          {tasks.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="rounded-full border border-ink/15 bg-navy-900/60 px-3.5 py-2 text-xs font-medium text-ink outline-none focus:border-gold-500/50"
              >
                <option value="all">All Projects</option>
                {projectNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <div className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-navy-900/60 px-3.5 py-1.5">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-transparent text-xs text-ink outline-none [color-scheme:dark]"
                />
                <span className="text-xs text-ink/30">–</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-transparent text-xs text-ink outline-none [color-scheme:dark]"
                />
              </div>
              {(projectFilter !== 'all' || dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setProjectFilter('all')
                    setDateFrom('')
                    setDateTo('')
                  }}
                  className="text-xs text-ink/40 hover:text-ink/70"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-5 flex flex-col gap-4 rounded-2xl border border-ink/10 bg-navy-900/50 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-display text-lg font-semibold text-ink">Welcome back, {firstName}!</p>
              <p className="mt-0.5 text-sm text-ink/50">Here's the status of your requests and ongoing work.</p>
            </div>
            {currentProject && (
              <div className="flex items-center gap-3 rounded-xl border border-ink/10 bg-navy-950/40 px-4 py-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500/15 text-gold-300">
                  <BuildingIcon className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-xs text-ink/40">Current Project</p>
                  <p className="text-sm font-semibold text-ink">{currentProject}</p>
                </div>
              </div>
            )}
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setModalOpen(true)}
            className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full bg-gold-500 px-4 py-2.5 text-sm font-semibold text-charcoal hover:bg-gold-400 sm:w-auto"
          >
            <PlusIcon className="h-4 w-4" /> New Report
          </motion.button>

          {error && <p className="mt-5 text-sm text-red-400">{error}</p>}

          {loading ? (
            <div className="mt-16 flex justify-center">
              <Spinner className="h-6 w-6 text-ink/40" />
            </div>
          ) : (
            <>
              {filteredTasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-6 flex flex-col gap-5 rounded-2xl border border-ink/10 bg-navy-900/50 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <ProgressRing
                    percent={(filteredTasks.filter((t) => t.status === 'completed').length / filteredTasks.length) * 100}
                    label="Overall Progress"
                    sublabel={`${filteredTasks.filter((t) => t.status === 'completed').length} of ${filteredTasks.length} requests resolved`}
                  />
                  <div className="flex gap-6 sm:gap-8">
                    {COLUMNS.map((col) => (
                      <div key={col.status} className="text-center">
                        <p className={`font-display text-xl font-bold ${col.text}`}>
                          {filteredTasks.filter((t) => t.status === col.status).length}
                        </p>
                        <p className="mt-0.5 text-xs text-ink/45">{col.label.replace(' Requests', '')}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="mt-6 space-y-6">
                {COLUMNS.map((col, colIndex) => {
                  const items = filteredTasks.filter((t) => t.status === col.status)
                  const Icon = col.icon
                  return (
                    <motion.div
                      key={col.status}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: colIndex * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      className="rounded-2xl border border-ink/10 bg-navy-900/50 p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="flex shrink-0 items-start gap-3 sm:w-52 sm:flex-col sm:items-center sm:text-center">
                          <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 ${col.ring}`}>
                            <Icon className="h-6 w-6" />
                          </span>
                          <div>
                            <p className={`font-display text-sm font-semibold ${col.text}`}>{col.label.replace(' Requests', '')}</p>
                            <p className="mt-0.5 text-xs text-ink/45">{col.description}</p>
                          </div>
                        </div>

                        <ArrowRightSmallIcon className={`hidden h-5 w-5 shrink-0 self-center sm:block ${col.text} opacity-50`} />

                        <div className="min-w-0 flex-1">
                          <p className={`mb-2 text-sm font-semibold ${col.text}`}>
                            {col.label} ({items.length})
                          </p>
                          {items.length === 0 ? (
                            <p className="flex h-full items-center justify-center rounded-lg border border-dashed border-ink/10 py-6 text-sm text-ink/30">
                              Nothing here yet.
                            </p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                                <thead>
                                  <tr className="text-xs uppercase tracking-wide text-ink/35">
                                    <th className="pb-2 pr-3 font-medium">ID</th>
                                    <th className="pb-2 pr-3 font-medium">Request</th>
                                    <th className="pb-2 pr-3 font-medium">Project</th>
                                    <th className="pb-2 pr-3 font-medium">{col.dateLabel}</th>
                                    <th className="pb-2 pr-3 font-medium">{col.personLabel}</th>
                                    <th className="pb-2 pr-3 font-medium">Priority</th>
                                    <th className="pb-2 font-medium" />
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((task) => {
                                    const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
                                    return (
                                      <tr key={task.id} className="border-t border-ink/5">
                                        <td className="py-2.5 pr-3 font-mono text-xs text-ink/40">#{task.displayId}</td>
                                        <td className="py-2.5 pr-3">
                                          <p className="font-medium text-ink/90">{task.title}</p>
                                          {task.description && <p className="text-xs text-ink/40">{task.description}</p>}
                                        </td>
                                        <td className="py-2.5 pr-3 text-ink/60">
                                          {task.projectName || '—'}
                                          {task.projectLocation && (
                                            <span className="block text-xs text-ink/35">{task.projectLocation}</span>
                                          )}
                                        </td>
                                        <td className="py-2.5 pr-3 text-xs text-ink/50">{formatDate(task[col.dateKey])}</td>
                                        <td className="py-2.5 pr-3 text-ink/60">{task.personName || '—'}</td>
                                        <td className="py-2.5 pr-3">
                                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${priorityCfg.border} ${priorityCfg.bg} ${priorityCfg.color}`}>
                                            {priorityCfg.label}
                                          </span>
                                        </td>
                                        <td className="py-2.5">
                                          <button
                                            onClick={() => setActiveTask(task)}
                                            className="flex items-center gap-1 whitespace-nowrap rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:border-gold-500/40 hover:text-ink"
                                          >
                                            View Details <ChevronRightSmallIcon className="h-3.5 w-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {tasks.length > 0 && (
                <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-blue-400/20 bg-blue-500/5 px-4 py-3 text-sm text-ink/60">
                  <InfoIcon className="h-4 w-4 shrink-0 text-blue-300" />
                  Click on "View Details" to see full request information, updates and attachments.
                </div>
              )}
            </>
          )}

          <AddTaskModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
          <TaskDetailModal
            task={activeTask}
            onClose={() => setActiveTask(null)}
            onAdvance={handleAdvance}
            onDelete={handleDelete}
          />
        </>
      )}
    </DashboardShell>
  )
}

export default TaskTrackerPage
