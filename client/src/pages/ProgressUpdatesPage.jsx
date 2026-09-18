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

const iconBase = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }
const TimelineTabIcon = (p) => <svg {...iconBase} {...p}><path d="M4 6h16M4 12h16M4 18h10" /></svg>
const PhotosTabIcon = (p) => <svg {...iconBase} {...p}><rect x="3.5" y="5" width="17" height="14" rx="2" /><circle cx="9" cy="10.5" r="1.7" /><path d="m4 17 5-5 4 4 3-3 4 4" /></svg>
const TasksTabIcon = (p) => <svg {...iconBase} {...p}><rect x="5" y="4" width="14" height="17" rx="1.5" /><path d="m8.5 12 2 2 4-4" /></svg>
const ReportsTabIcon = (p) => <svg {...iconBase} {...p}><path d="M4 19h16" /><path d="M7 19v-5M12 19V8M17 19v-9" /></svg>
const TeamTabIcon = (p) => <svg {...iconBase} {...p}><circle cx="9" cy="8" r="3" /><path d="M4 19v-1a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v1" /><path d="M15.5 5a2.5 2.5 0 0 1 0 5M17.5 19v-1a3.5 3.5 0 0 0-2-3.16" /></svg>
const CalendarTileIcon = (p) => <svg {...iconBase} {...p}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></svg>
const FlagTileIcon = (p) => <svg {...iconBase} {...p}><path d="M5 3v18" /><path d="M5 4h11l-2.5 3.5L16 11H5" /></svg>
const CheckTileIcon = (p) => <svg {...iconBase} {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.3 2.3L16 10" /></svg>
const ClockTileIcon = (p) => <svg {...iconBase} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
const BellTileIcon = (p) => <svg {...iconBase} {...p}><path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 12 6 8Z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
const CameraTileIcon = (p) => <svg {...iconBase} {...p}><path d="M4 8h3l1.5-2h7L17 8h3v11H4Z" /><circle cx="12" cy="13.5" r="3.2" /></svg>

const MILESTONE_ICONS = {
  foundation: (p) => <svg {...iconBase} {...p}><path d="M4 21V10l8-6 8 6v11" /><path d="M4 21h16M9 21v-6h6v6" /></svg>,
  plinth: (p) => <svg {...iconBase} {...p}><rect x="4" y="9" width="16" height="4" rx="1" /><rect x="6" y="13" width="12" height="8" rx="1" /><path d="M4 9V6h16v3" /></svg>,
  walls: (p) => <svg {...iconBase} {...p}><rect x="3.5" y="4" width="17" height="16" rx="1" /><path d="M3.5 10h9M12.5 10v10M3.5 15h5M12.5 15h8" /></svg>,
  electrical: (p) => <svg {...iconBase} {...p}><path d="M13 2 5 14h6l-1 8 9-13h-6Z" /></svg>,
  plumbing: (p) => <svg {...iconBase} {...p}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" /></svg>,
  finishing: (p) => <svg {...iconBase} {...p}><path d="m12 3 1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4Z" /><path d="M19 15v4M17 17h4" /></svg>,
}

const TASK_TYPE_ICONS = {
  materials: (p) => <svg {...iconBase} {...p}><path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" /><path d="M4 7l8 4 8-4M12 11v10" /></svg>,
  work: (p) => <svg {...iconBase} {...p}><rect x="5" y="4" width="14" height="17" rx="1.5" /><path d="M9 3v3h6V3" /></svg>,
  site_visit: (p) => <svg {...iconBase} {...p}><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
}

const PRIORITY_STYLES = {
  high: 'bg-red-500/10 text-red-300',
  medium: 'bg-amber-500/10 text-amber-300',
  low: 'bg-emerald-500/10 text-emerald-300',
}

// Mirrors server/src/controllers/progressController.js's MILESTONES —
// thresholds only, used client-side purely to tag which phase an update's
// progress % falls into (see milestoneTagFor below).
const MILESTONE_THRESHOLDS = [
  { key: 'foundation', label: 'Foundation Work', threshold: 15 },
  { key: 'plinth', label: 'Plinth & Columns', threshold: 30 },
  { key: 'walls', label: 'Wall Construction', threshold: 55 },
  { key: 'electrical', label: 'Electrical Work', threshold: 75 },
  { key: 'plumbing', label: 'Plumbing Work', threshold: 90 },
  { key: 'finishing', label: 'Finishing', threshold: 100 },
]

function initialsOf(name) {
  return (name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const TABS = [
  { key: 'timeline', label: 'Timeline', icon: TimelineTabIcon },
  { key: 'photos', label: 'Photos', icon: PhotosTabIcon },
  { key: 'tasks', label: 'Tasks', icon: TasksTabIcon },
  { key: 'reports', label: 'Reports', icon: ReportsTabIcon },
  { key: 'team', label: 'Team Updates', icon: TeamTabIcon },
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
  const [feedAuthor, setFeedAuthor] = useState('all')
  const [feedPhotosOnly, setFeedPhotosOnly] = useState(false)
  const [feedSort, setFeedSort] = useState('newest')
  const [lightboxUrl, setLightboxUrl] = useState(null)

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

  const feedAuthors = useMemo(() => [...new Set(updates.map((u) => u.authorName))].sort(), [updates])
  const filteredFeed = useMemo(() => {
    let result = updates.filter((u) => {
      if (feedAuthor !== 'all' && u.authorName !== feedAuthor) return false
      if (feedPhotosOnly && (!u.photoUrls || u.photoUrls.length === 0)) return false
      return true
    })
    result = [...result].sort((a, b) =>
      feedSort === 'newest' ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt)
    )
    return result
  }, [updates, feedAuthor, feedPhotosOnly, feedSort])

  // Which phase an update's progress % lands in — mirrors the thresholds in
  // server/src/controllers/progressController.js's MILESTONES (kept in sync
  // manually, same pattern as BUDGET_CATEGORIES) — used only for a small
  // contextual tag on the feed, derived from the update's own real % value.
  const milestoneTagFor = (progressPercent) => {
    if (progressPercent == null) return null
    return MILESTONE_THRESHOLDS.find((m) => progressPercent <= m.threshold) || MILESTONE_THRESHOLDS[MILESTONE_THRESHOLDS.length - 1]
  }

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
                        { label: 'Start Date', value: formatDate(project.startDate) || 'Not set', icon: CalendarTileIcon },
                        { label: 'Expected Completion', value: formatDate(project.expectedCompletion) || 'Not set', icon: FlagTileIcon },
                        { label: 'Completed Tasks', value: `${taskCounts.completed}/${totalTasks || 0}`, icon: CheckTileIcon },
                        { label: 'On Time', value: schedule ? (schedule.onTrack ? 'On Track' : 'Behind Schedule') : 'Not enough data', accent: schedule ? (schedule.onTrack ? 'text-emerald-300' : 'text-red-400') : 'text-ink/50', icon: ClockTileIcon },
                        { label: 'Total Updates', value: updates.length >= 50 ? '50+' : updates.length, icon: BellTileIcon },
                      ].map((tile) => (
                        <div key={tile.label} className="rounded-2xl border border-ink/10 bg-navy-900/50 p-3.5">
                          <div className="flex items-center gap-1.5 text-ink/35">
                            <tile.icon className="h-3.5 w-3.5" />
                            <p className="text-[10px] font-medium uppercase tracking-wider">{tile.label}</p>
                          </div>
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
                        className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors duration-150 ${
                          tab === t.key ? 'bg-gold-500 text-charcoal' : 'text-ink/55 hover:text-ink'
                        }`}
                      >
                        <t.icon className="h-3.5 w-3.5" />
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-ink/10 bg-navy-900/50 p-5">
                    {tab === 'timeline' && (
                      <div className="space-y-0">
                        {milestones.map((m, i) => {
                          const style = STATUS_STYLES[m.status]
                          const MilestoneIcon = MILESTONE_ICONS[m.key] || CheckTileIcon
                          return (
                            <div key={m.key} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.bg} ${style.text}`}>
                                  <MilestoneIcon className="h-4 w-4" />
                                </span>
                                {i < milestones.length - 1 && <span className="w-px flex-1 bg-ink/10" />}
                              </div>
                              <div className="pb-6 pt-1">
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
                            <button
                              key={i}
                              onClick={() => setLightboxUrl(p.url)}
                              className="overflow-hidden rounded-xl border border-ink/10 bg-navy-950/40 text-left transition-transform duration-150 hover:scale-[1.02] hover:border-gold-500/30"
                            >
                              <img src={p.url} alt={p.updateTitle} className="h-28 w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                              <p className="truncate px-2 py-1.5 text-[10px] text-ink/45">{p.updateTitle}</p>
                            </button>
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
                            const TypeIcon = TASK_TYPE_ICONS[task.type] || TasksTabIcon
                            return (
                              <div key={task.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-navy-950/40 px-4 py-2.5">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink/50">
                                    <TypeIcon className="h-4 w-4" />
                                  </span>
                                  <div>
                                    <p className="text-sm text-ink/90">{task.title}</p>
                                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink/40">
                                      {task.displayId}
                                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium}`}>{task.priority}</span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => cycleTaskStatus(task)}
                                  disabled={taskActionId === task.id}
                                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${style.bg} ${style.text} disabled:opacity-50`}
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
                              <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-500/15 text-[10px] font-semibold text-gold-300">
                                  {initialsOf(g.author)}
                                </span>
                                <p className="text-sm font-semibold text-ink">{g.author} <span className="font-normal text-ink/40">· {g.list.length} update{g.list.length === 1 ? '' : 's'}</span></p>
                              </div>
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
                    <div className="mt-4 rounded-2xl border border-gold-500/20 bg-navy-900/50 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-gold-300/70">Latest Update</p>
                        {latestUpdate.progressPercent != null ? (
                          <span className="rounded-full bg-gold-500/10 px-2.5 py-1 text-[10px] font-semibold text-gold-300">
                            {latestUpdate.progressPercent}% · {milestoneTagFor(latestUpdate.progressPercent)?.label}
                          </span>
                        ) : (
                          <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[10px] font-medium text-ink/45">Note</span>
                        )}
                      </div>
                      <p className="mt-1.5 font-display text-sm font-semibold text-ink">{latestUpdate.title}</p>
                      {latestUpdate.description && <p className="mt-1 text-sm text-ink/60">{latestUpdate.description}</p>}
                      {latestUpdate.photoUrls?.length > 0 && (
                        <div className="mt-3 flex gap-2 overflow-x-auto">
                          {latestUpdate.photoUrls.slice(0, 3).map((url, i) => (
                            <button key={i} onClick={() => setLightboxUrl(url)} className="shrink-0">
                              <img src={url} alt="" className="h-20 w-28 rounded-lg object-cover hover:opacity-90" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                            </button>
                          ))}
                          {latestUpdate.photoUrls.length > 3 && (
                            <button onClick={() => setTab('photos')} className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg border border-ink/10 bg-navy-950/40 text-xs text-gold-300 hover:border-gold-500/30">
                              +{latestUpdate.photoUrls.length - 3} more
                            </button>
                          )}
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-2 text-xs text-ink/40">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-500/15 text-[9px] font-semibold text-gold-300">
                          {initialsOf(latestUpdate.authorName)}
                        </span>
                        Updated by {latestUpdate.authorName} · {timeAgo(latestUpdate.createdAt)}
                      </div>
                    </div>
                  )}

                  {/* Quick Update actions */}
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <button onClick={openModal} className="flex items-center gap-1.5 rounded-full border border-gold-500/40 px-4 py-2 text-xs font-semibold text-gold-300 hover:bg-gold-500/10">+ Post Update</button>
                    <button onClick={openModal} className="flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-xs font-medium text-ink/70 hover:border-ink/30">
                      <CameraTileIcon className="h-3.5 w-3.5" /> Upload Photos
                    </button>
                    <button onClick={openModal} className="flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-xs font-medium text-ink/70 hover:border-ink/30">
                      <TimelineTabIcon className="h-3.5 w-3.5" /> Add Note
                    </button>
                    <button onClick={() => setTab('tasks')} className="flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-xs font-medium text-ink/70 hover:border-ink/30">
                      <TasksTabIcon className="h-3.5 w-3.5" /> Mark Task
                    </button>
                    <button onClick={handleNotifyTeam} className="flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-xs font-medium text-ink/70 hover:border-ink/30">
                      <BellTileIcon className="h-3.5 w-3.5" /> Notify Team
                    </button>
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
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-ink">Recent Updates</p>
                      {updates.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={feedAuthor}
                            onChange={(e) => setFeedAuthor(e.target.value)}
                            className="rounded-full border border-ink/10 bg-navy-950/40 px-3 py-1.5 text-[11px] text-ink/70 outline-none"
                          >
                            <option value="all">All Authors</option>
                            {feedAuthors.map((a) => (
                              <option key={a} value={a}>{a}</option>
                            ))}
                          </select>
                          <select
                            value={feedSort}
                            onChange={(e) => setFeedSort(e.target.value)}
                            className="rounded-full border border-ink/10 bg-navy-950/40 px-3 py-1.5 text-[11px] text-ink/70 outline-none"
                          >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                          </select>
                          <button
                            onClick={() => setFeedPhotosOnly((v) => !v)}
                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors duration-150 ${
                              feedPhotosOnly ? 'border-gold-500/50 bg-gold-500/10 text-gold-300' : 'border-ink/10 text-ink/60 hover:border-ink/20'
                            }`}
                          >
                            <CameraTileIcon className="h-3.5 w-3.5" /> With Photos
                          </button>
                        </div>
                      )}
                    </div>
                    {updates.length === 0 ? (
                      <p className="mt-3 text-sm text-ink/40">No updates posted yet.</p>
                    ) : filteredFeed.length === 0 ? (
                      <p className="mt-3 text-sm text-ink/40">No updates match these filters.</p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {filteredFeed.slice(0, 10).map((u) => {
                          const tag = milestoneTagFor(u.progressPercent)
                          return (
                            <div key={u.id} className="flex gap-3 border-t border-ink/10 pt-3 first:border-t-0 first:pt-0">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-[10px] font-semibold text-gold-300">
                                {initialsOf(u.authorName)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-sm text-ink/90">{u.title}</p>
                                  {u.progressPercent != null ? (
                                    <span className="shrink-0 rounded-full bg-gold-500/10 px-2 py-0.5 text-[10px] font-medium text-gold-300">{u.progressPercent}% · {tag?.label}</span>
                                  ) : (
                                    <span className="shrink-0 rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-medium text-ink/40">Note</span>
                                  )}
                                </div>
                                {u.description && <p className="mt-0.5 text-xs text-ink/50">{u.description}</p>}
                                {u.photoUrls?.length > 0 && (
                                  <div className="mt-2 flex gap-1.5">
                                    {u.photoUrls.slice(0, 4).map((url, i) => (
                                      <button key={i} onClick={() => setLightboxUrl(url)}>
                                        <img src={url} alt="" className="h-12 w-16 rounded-md object-cover hover:opacity-90" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <p className="mt-1 text-[11px] text-ink/35">{u.authorName} · {timeAgo(u.createdAt)}</p>
                              </div>
                            </div>
                          )
                        })}
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
            {lightboxUrl && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightboxUrl(null)} className="fixed inset-0 z-40 bg-black/85" />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2"
                >
                  <button onClick={() => setLightboxUrl(null)} className="absolute -top-9 right-0 text-sm text-ink/70 hover:text-ink">✕ Close</button>
                  <img src={lightboxUrl} alt="" className="max-h-[80vh] w-full rounded-2xl object-contain" />
                </motion.div>
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
