import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import Spinner from '../components/Spinner.jsx'
import FormField from '../components/FormField.jsx'
import ProgressRing from '../components/tasks/ProgressRing.jsx'
import { ProjectsIcon } from '../components/dashboard/icons.jsx'
import { apiFetch } from '../utils/api.js'

const TABS = [
  { key: 'timeline', label: 'Timeline' },
  { key: 'photos', label: 'Photos' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'reports', label: 'Reports' },
  { key: 'team', label: 'Team Updates' },
]

const STATUS_STYLES = {
  completed: { dot: 'bg-emerald-400', text: 'text-emerald-300', bg: 'bg-emerald-500/10', label: 'Completed' },
  in_progress: { dot: 'bg-gold-400', text: 'text-gold-300', bg: 'bg-gold-500/10', label: 'In Progress' },
  pending: { dot: 'bg-ink/25', text: 'text-ink/45', bg: 'bg-ink/5', label: 'Pending' },
}

function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

// Real progress-over-time trend from the project's own update history — no
// synthetic data. A single series needs no legend/categorical validation
// (per the dataviz method); brand gold is used consistently for "progress"
// the same way it's used for price/money elsewhere in the app.
function ProgressChart({ points }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const width = 600
  const height = 160
  const padX = 16
  const padY = 16

  const xs = points.map((p, i) => padX + (i / Math.max(1, points.length - 1)) * (width - padX * 2))
  const ys = points.map((p) => padY + (1 - p.progressPercent / 100) * (height - padY * 2))
  const coords = points.map((p, i) => ({ x: xs[i], y: ys[i], ...p }))
  const linePath = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = coords.length
    ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height - padY} L ${coords[0].x.toFixed(1)} ${height - padY} Z`
    : ''

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" onMouseLeave={() => setHoverIdx(null)}>
        <defs>
          <linearGradient id="progress-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eab424" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#eab424" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((pct) => (
          <line
            key={pct}
            x1={padX}
            x2={width - padX}
            y1={padY + (1 - pct / 100) * (height - padY * 2)}
            y2={padY + (1 - pct / 100) * (height - padY * 2)}
            stroke="currentColor"
            className="text-ink/5"
            strokeWidth="1"
          />
        ))}
        <path d={areaPath} fill="url(#progress-trend-fill)" />
        <path d={linePath} fill="none" stroke="#eab424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((p, i) => (
          <g key={p.id || i}>
            <circle cx={p.x} cy={p.y} r={hoverIdx === i ? 4 : 2.5} fill="#eab424" />
            <rect
              x={p.x - (width / coords.length) / 2}
              y={0}
              width={width / coords.length}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
            />
          </g>
        ))}
        {hoverIdx !== null && (
          <line x1={coords[hoverIdx].x} y1={padY} x2={coords[hoverIdx].x} y2={height - padY} stroke="#eab424" strokeOpacity="0.35" strokeWidth="1" />
        )}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-ink/35">
        <span>{formatDate(points[0]?.createdAt)}</span>
        <span>{formatDate(points[points.length - 1]?.createdAt)}</span>
      </div>
      {hoverIdx !== null && (
        <p className="mt-1 text-center text-xs text-ink/60">
          {formatDate(coords[hoverIdx].createdAt)}: <span className="font-semibold text-gold-300">{coords[hoverIdx].progressPercent}%</span>
        </p>
      )}
    </div>
  )
}

const updateFormInitial = { title: '', description: '', progressPercent: '', photoUrls: '' }

function ProgressUpdatesPage() {
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState(null)

  const [data, setData] = useState(null) // { project, milestones, updates, taskCounts }
  const [tasks, setTasks] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const [error, setError] = useState('')

  const [tab, setTab] = useState('timeline')
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updateForm, setUpdateForm] = useState(updateFormInitial)
  const [updateError, setUpdateError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [taskActionId, setTaskActionId] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await apiFetch('/api/projects')
        const list = res.projects || []
        setProjects(list)
        if (list.length) setSelectedProjectId(list[0].id)
      } catch (err) {
        setError(err.message)
      } finally {
        setProjectsLoading(false)
      }
    })()
  }, [])

  const loadProgress = async (projectId) => {
    if (!projectId) return
    setDataLoading(true)
    setError('')
    try {
      const [progressRes, tasksRes] = await Promise.all([
        apiFetch(`/api/projects/${projectId}/progress`),
        apiFetch(`/api/projects/${projectId}/tasks`),
      ])
      setData(progressRes?.project ? progressRes : null)
      setTasks(tasksRes.tasks || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (selectedProjectId) loadProgress(selectedProjectId)
  }, [selectedProjectId])

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3200)
  }

  const project = data?.project
  const milestones = data?.milestones || []
  const updates = data?.updates || []
  const taskCounts = data?.taskCounts || { pending: 0, in_progress: 0, completed: 0 }
  const totalTasks = taskCounts.pending + taskCounts.in_progress + taskCounts.completed

  const schedule = useMemo(() => {
    if (!project?.startDate || !project?.expectedCompletion) return null
    const start = new Date(project.startDate).getTime()
    const end = new Date(project.expectedCompletion).getTime()
    if (end <= start) return null
    const elapsedRatio = Math.min(1, Math.max(0, (Date.now() - start) / (end - start)))
    const progressRatio = project.progressPercent / 100
    return { onTrack: progressRatio >= elapsedRatio - 0.1, elapsedRatio }
  }, [project])

  const chartPoints = useMemo(
    () =>
      [...updates]
        .filter((u) => u.progressPercent != null)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [updates]
  )

  const photos = useMemo(
    () => updates.flatMap((u) => (u.photoUrls || []).map((url) => ({ url, updateTitle: u.title, createdAt: u.createdAt }))),
    [updates]
  )

  const teamGroups = useMemo(() => {
    const groups = new Map()
    for (const u of updates) {
      if (!groups.has(u.authorName)) groups.set(u.authorName, [])
      groups.get(u.authorName).push(u)
    }
    return [...groups.entries()].map(([author, list]) => ({ author, list }))
  }, [updates])

  const latestUpdate = updates[0]

  const openModal = () => {
    setUpdateForm(updateFormInitial)
    setUpdateError('')
    setShowUpdateModal(true)
  }

  const handleSubmitUpdate = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!updateForm.title.trim()) {
      setUpdateError('Give the update a title')
      return
    }
    setSubmitting(true)
    setUpdateError('')
    try {
      const photoUrls = updateForm.photoUrls
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      await apiFetch(`/api/projects/${selectedProjectId}/progress-updates`, {
        method: 'POST',
        body: JSON.stringify({
          title: updateForm.title.trim(),
          description: updateForm.description.trim() || undefined,
          progressPercent: updateForm.progressPercent !== '' ? Number(updateForm.progressPercent) : undefined,
          photoUrls,
        }),
      })
      setShowUpdateModal(false)
      showToast('Update posted')
      await loadProgress(selectedProjectId)
    } catch (err) {
      setUpdateError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleNotifyTeam = async () => {
    try {
      await apiFetch(`/api/projects/${selectedProjectId}/progress-updates`, {
        method: 'POST',
        body: JSON.stringify({ title: 'Team notified', description: 'The team has been notified about the latest progress on this project.' }),
      })
      showToast('Team notified')
      await loadProgress(selectedProjectId)
    } catch (err) {
      showToast(err.message)
    }
  }

  const cycleTaskStatus = async (task) => {
    const next = task.status === 'pending' ? 'in_progress' : task.status === 'in_progress' ? 'completed' : 'pending'
    setTaskActionId(task.id)
    try {
      await apiFetch(`/api/tasks/${task.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) })
      await loadProgress(selectedProjectId)
    } catch (err) {
      showToast(err.message)
    } finally {
      setTaskActionId(null)
    }
  }

  if (!projectsLoading && projects.length === 0) {
    return (
      <DashboardShell>
        {({ onMenuClick }) => (
          <>
            <DashboardHeader onMenuClick={onMenuClick} title="Progress Updates" subtitle="Track your project progress and receive updates." />
            <div className="mt-16 flex flex-col items-center gap-3 text-center text-ink/40">
              <ProjectsIcon className="h-10 w-10" />
              <p className="text-sm">Create a project first to start tracking its progress.</p>
              <Link to="/dashboard/projects" className="mt-1 rounded-full bg-gold-500 px-4 py-2 text-xs font-semibold text-charcoal hover:bg-gold-400">
                + New Project
              </Link>
            </div>
          </>
        )}
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader onMenuClick={onMenuClick} title="Progress Updates" subtitle="Track your project progress and receive updates." />

          {projectsLoading ? (
            <div className="mt-16 flex justify-center"><Spinner className="h-6 w-6 text-ink/40" /></div>
          ) : (
            <>
              <div className="mt-5 flex flex-wrap gap-2">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors duration-150 ${
                      selectedProjectId === p.id ? 'border-gold-500/50 bg-gold-500/10 text-gold-300' : 'border-ink/10 text-ink/60 hover:border-ink/20'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

              {dataLoading || !project ? (
                <div className="mt-16 flex justify-center"><Spinner className="h-6 w-6 text-ink/40" /></div>
              ) : (
                <>
                  {/* Progress ring + stat tiles */}
                  <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr]">
                    <div className="flex items-center rounded-2xl border border-ink/10 bg-navy-900/50 p-5">
                      <ProgressRing percent={project.progressPercent} label={project.name} sublabel={project.location || 'No location set'} size={100} stroke={9} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      {[
                        { label: 'Start Date', value: formatDate(project.startDate) || 'Not set' },
                        { label: 'Expected Completion', value: formatDate(project.expectedCompletion) || 'Not set' },
                        { label: 'Completed Tasks', value: `${taskCounts.completed}/${totalTasks || 0}` },
                        { label: 'On Time', value: schedule ? (schedule.onTrack ? 'On Track' : 'Behind Schedule') : 'Not enough data', accent: schedule ? (schedule.onTrack ? 'text-emerald-300' : 'text-red-400') : 'text-ink/50' },
                        { label: 'Total Updates', value: updates.length >= 50 ? '50+' : updates.length },
                      ].map((tile) => (
                        <div key={tile.label} className="rounded-2xl border border-ink/10 bg-navy-900/50 p-3.5">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-ink/40">{tile.label}</p>
                          <p className={`mt-1.5 text-sm font-semibold ${tile.accent || 'text-ink'}`}>{tile.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="mt-6 flex flex-wrap gap-1 rounded-full border border-ink/10 p-1 sm:inline-flex">
                    {TABS.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors duration-150 ${
                          tab === t.key ? 'bg-gold-500 text-charcoal' : 'text-ink/55 hover:text-ink'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-ink/10 bg-navy-900/50 p-5">
                    {tab === 'timeline' && (
                      <div className="space-y-0">
                        {milestones.map((m, i) => {
                          const style = STATUS_STYLES[m.status]
                          return (
                            <div key={m.key} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${style.dot}`} />
                                {i < milestones.length - 1 && <span className="w-px flex-1 bg-ink/10" />}
                              </div>
                              <div className="pb-6">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-medium text-ink">{m.label}</p>
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}>{style.label}</span>
                                </div>
                                {(m.startDate || m.endDate) && (
                                  <p className="mt-0.5 text-xs text-ink/40">
                                    {formatDate(m.startDate)} – {formatDate(m.endDate)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {tab === 'photos' && (
                      photos.length === 0 ? (
                        <p className="py-8 text-center text-sm text-ink/40">No photos yet. Add some with your next update.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                          {photos.map((p, i) => (
                            <div key={i} className="overflow-hidden rounded-xl border border-ink/10 bg-navy-950/40">
                              <img src={p.url} alt={p.updateTitle} className="h-28 w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                              <p className="truncate px-2 py-1.5 text-[10px] text-ink/45">{p.updateTitle}</p>
                            </div>
                          ))}
                        </div>
                      )
                    )}

                    {tab === 'tasks' && (
                      tasks.length === 0 ? (
                        <p className="py-8 text-center text-sm text-ink/40">No tasks linked to this project yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {tasks.map((task) => {
                            const style = STATUS_STYLES[task.status]
                            return (
                              <div key={task.id} className="flex items-center justify-between rounded-xl border border-ink/10 bg-navy-950/40 px-4 py-2.5">
                                <div>
                                  <p className="text-sm text-ink/90">{task.title}</p>
                                  <p className="text-xs text-ink/40">{task.displayId} · {task.priority} priority</p>
                                </div>
                                <button
                                  onClick={() => cycleTaskStatus(task)}
                                  disabled={taskActionId === task.id}
                                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${style.bg} ${style.text} disabled:opacity-50`}
                                >
                                  {taskActionId === task.id && <Spinner className="h-3 w-3" />}
                                  {style.label}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )
                    )}

                    {tab === 'reports' && (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {[
                          { label: 'Milestones Completed', value: `${milestones.filter((m) => m.status === 'completed').length}/${milestones.length}` },
                          { label: 'Tasks Completed', value: `${taskCounts.completed}/${totalTasks || 0}` },
                          { label: 'Updates Logged', value: updates.length >= 50 ? '50+' : updates.length },
                          { label: 'Last Update', value: latestUpdate ? timeAgo(latestUpdate.createdAt) : 'None yet' },
                          { label: 'Overall Status', value: schedule ? (schedule.onTrack ? 'On Track' : 'Behind Schedule') : 'Not enough data' },
                          { label: 'Current Progress', value: `${project.progressPercent}%` },
                        ].map((r) => (
                          <div key={r.label} className="rounded-xl border border-ink/10 bg-navy-950/40 p-3.5">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-ink/40">{r.label}</p>
                            <p className="mt-1.5 text-sm font-semibold text-ink">{r.value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {tab === 'team' && (
                      teamGroups.length === 0 ? (
                        <p className="py-8 text-center text-sm text-ink/40">No updates from the team yet.</p>
                      ) : (
                        <div className="space-y-4">
                          {teamGroups.map((g) => (
                            <div key={g.author}>
                              <p className="text-sm font-semibold text-ink">{g.author} <span className="font-normal text-ink/40">· {g.list.length} update{g.list.length === 1 ? '' : 's'}</span></p>
                              <div className="mt-2 space-y-1.5 border-l-2 border-ink/10 pl-3">
                                {g.list.slice(0, 5).map((u) => (
                                  <p key={u.id} className="text-xs text-ink/60">
                                    <span className="text-ink/35">{timeAgo(u.createdAt)} · </span>{u.title}
                                  </p>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>

                  {/* Latest Update */}
                  {latestUpdate && (
                    <div className="mt-4 rounded-2xl border border-ink/10 bg-navy-900/50 p-5">
                      <p className="text-xs font-medium uppercase tracking-wider text-ink/40">Latest Update</p>
                      <p className="mt-1.5 font-display text-sm font-semibold text-ink">{latestUpdate.title}</p>
                      {latestUpdate.description && <p className="mt-1 text-sm text-ink/60">{latestUpdate.description}</p>}
                      {latestUpdate.photoUrls?.length > 0 && (
                        <div className="mt-3 flex gap-2 overflow-x-auto">
                          {latestUpdate.photoUrls.slice(0, 3).map((url, i) => (
                            <img key={i} src={url} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                          ))}
                        </div>
                      )}
                      <p className="mt-3 text-xs text-ink/40">Updated by {latestUpdate.authorName} · {timeAgo(latestUpdate.createdAt)}</p>
                    </div>
                  )}

                  {/* Quick Update actions */}
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <button onClick={openModal} className="flex items-center gap-1.5 rounded-full border border-gold-500/40 px-4 py-2 text-xs font-semibold text-gold-300 hover:bg-gold-500/10">+ Post Update</button>
                    <button onClick={openModal} className="rounded-full border border-ink/15 px-4 py-2 text-xs font-medium text-ink/70 hover:border-ink/30">Upload Photos</button>
                    <button onClick={openModal} className="rounded-full border border-ink/15 px-4 py-2 text-xs font-medium text-ink/70 hover:border-ink/30">Add Note</button>
                    <button onClick={() => setTab('tasks')} className="rounded-full border border-ink/15 px-4 py-2 text-xs font-medium text-ink/70 hover:border-ink/30">Mark Task</button>
                    <button onClick={handleNotifyTeam} className="rounded-full border border-ink/15 px-4 py-2 text-xs font-medium text-ink/70 hover:border-ink/30">Notify Team</button>
                  </div>

                  {/* Progress chart */}
                  <div className="mt-4 rounded-2xl border border-ink/10 bg-navy-900/50 p-5">
                    <p className="text-sm font-semibold text-ink">Progress Over Time</p>
                    {chartPoints.length < 2 ? (
                      <p className="mt-6 text-center text-sm text-ink/40">Post at least two updates with a progress % to see the trend.</p>
                    ) : (
                      <div className="mt-3"><ProgressChart points={chartPoints} /></div>
                    )}
                  </div>

                  {/* Recent updates feed */}
                  <div className="mt-4 rounded-2xl border border-ink/10 bg-navy-900/50 p-5">
                    <p className="text-sm font-semibold text-ink">Recent Updates</p>
                    {updates.length === 0 ? (
                      <p className="mt-3 text-sm text-ink/40">No updates posted yet.</p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {updates.slice(0, 10).map((u) => (
                          <div key={u.id} className="border-t border-ink/10 pt-3 first:border-t-0 first:pt-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm text-ink/90">{u.title}</p>
                              {u.progressPercent != null && <span className="rounded-full bg-gold-500/10 px-2 py-0.5 text-[10px] font-medium text-gold-300">{u.progressPercent}%</span>}
                            </div>
                            {u.description && <p className="mt-0.5 text-xs text-ink/50">{u.description}</p>}
                            <p className="mt-1 text-[11px] text-ink/35">{u.authorName} · {timeAgo(u.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          <AnimatePresence>
            {showUpdateModal && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUpdateModal(false)} className="fixed inset-0 z-40 bg-black/70" />
                <motion.form
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  onSubmit={handleSubmitUpdate}
                  className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-ink/10 bg-navy-900 p-5 shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-display text-sm font-semibold text-ink">Post an Update</p>
                    <button type="button" onClick={() => setShowUpdateModal(false)} className="text-ink/40 hover:text-ink">✕</button>
                  </div>
                  {updateError && <p className="mt-3 text-sm text-red-400">{updateError}</p>}
                  <div className="mt-4 space-y-3.5">
                    <FormField id="title" label="Title" value={updateForm.title} onChange={(e) => setUpdateForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Wall plastering completed" />
                    <FormField id="description" label="Description (optional)" value={updateForm.description} onChange={(e) => setUpdateForm((p) => ({ ...p, description: e.target.value }))} placeholder="What happened on site today?" />
                    <FormField
                      id="progressPercent"
                      label="Overall progress % (optional — leave blank for a note-only update)"
                      type="number"
                      value={updateForm.progressPercent}
                      onChange={(e) => setUpdateForm((p) => ({ ...p, progressPercent: e.target.value }))}
                      placeholder="e.g. 65"
                    />
                    <FormField
                      id="photoUrls"
                      label="Photo URLs (optional, comma-separated)"
                      value={updateForm.photoUrls}
                      onChange={(e) => setUpdateForm((p) => ({ ...p, photoUrls: e.target.value }))}
                      placeholder="https://..., https://..."
                    />
                  </div>
                  <button type="submit" disabled={submitting} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-charcoal hover:bg-gold-400 disabled:opacity-60">
                    {submitting && <Spinner className="h-4 w-4" />}
                    Post Update
                  </button>
                </motion.form>
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-gold-500/40 bg-navy-900 px-5 py-2.5 text-sm text-ink shadow-2xl"
              >
                {toast}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </DashboardShell>
  )
}

export default ProgressUpdatesPage
