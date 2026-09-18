import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import Spinner from '../components/Spinner.jsx'
import FormField from '../components/FormField.jsx'
import ProgressRing from '../components/tasks/ProgressRing.jsx'
import { ProjectsIcon } from '../components/dashboard/icons.jsx'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { apiFetch } from '../utils/api.js'
import { uploadImages } from '../utils/upload.js'

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
const CameraIcon = (p) => <svg {...iconBase} {...p}><path d="M4 8h3l1.5-2h7L17 8h3v11H4Z" /><circle cx="12" cy="13.5" r="3.2" /></svg>
const NoteIcon = (p) => <svg {...iconBase} {...p}><path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v4h4M8 12h8M8 16h8" /></svg>
const ChecklistIcon = (p) => <svg {...iconBase} {...p}><rect x="5" y="4" width="14" height="17" rx="1.5" /><path d="m8.5 9 1.3 1.3L12.5 8" /><path d="M8.5 15h7M8.5 18h4" /></svg>
const PeopleIcon = (p) => <svg {...iconBase} {...p}><circle cx="9" cy="8" r="3" /><path d="M3.5 19v-1a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4v1" /><path d="M15.5 5a2.5 2.5 0 0 1 0 5M18 19v-1a3.5 3.5 0 0 0-2-3.16" /></svg>
const PersonIcon = (p) => <svg {...iconBase} {...p}><circle cx="12" cy="8" r="3.5" /><path d="M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1" /></svg>
const LocationDotIcon = (p) => <svg {...iconBase} {...p}><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
const SunIcon = (p) => <svg {...iconBase} {...p}><circle cx="12" cy="12" r="4.5" /><path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" /></svg>
const CloudIcon = (p) => <svg {...iconBase} {...p}><path d="M7 18h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.7 1.6A3.5 3.5 0 0 0 7 18Z" /></svg>
const RainIcon = (p) => <svg {...iconBase} {...p}><path d="M7 15h9a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.4 1.9A3.3 3.3 0 0 0 7 15Z" /><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" /></svg>
const HouseIcon = (p) => <svg {...iconBase} {...p}><path d="M4 11 12 4l8 7v9H4Z" /><path d="M9 20v-6h6v6" /></svg>
const PlusIcon = (p) => <svg {...iconBase} {...p}><path d="M12 5v14M5 12h14" /></svg>
const DocThumbIcon = (p) => <svg {...iconBase} {...p}><path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v4h4M8 12h8M8 16h5" /></svg>

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

const STATUS_STYLES = {
  completed: { dot: 'bg-emerald-400', text: 'text-emerald-300', bg: 'bg-emerald-500/10', label: 'Completed' },
  in_progress: { dot: 'bg-gold-400', text: 'text-gold-300', bg: 'bg-gold-500/10', label: 'In Progress' },
  pending: { dot: 'bg-ink/25', text: 'text-ink/45', bg: 'bg-ink/5', label: 'Pending' },
}

const TABS = [
  { key: 'timeline', label: 'Timeline', icon: TimelineTabIcon },
  { key: 'photos', label: 'Photos', icon: PhotosTabIcon },
  { key: 'tasks', label: 'Tasks', icon: TasksTabIcon },
  { key: 'reports', label: 'Reports', icon: ReportsTabIcon },
  { key: 'team', label: 'Team Updates', icon: TeamTabIcon },
]

// Chart line stays theme-reactive blue rather than the app's money-gold, so
// "progress over time" reads as a distinct identity from price/spend charts
// elsewhere. Same hex pair already validated (dataviz skill's validator)
// against these exact card surfaces for the Budget page's bar chart.
const CHART_COLOR = { dark: '#3987e5', light: '#2a78d6' }

const QUICK_UPDATE_ACTIONS = [
  { key: 'photos', label: 'Upload Photos', sub: 'Add site images', icon: CameraIcon, color: 'bg-emerald-500/15 text-emerald-400' },
  { key: 'note', label: 'Add Note', sub: 'Write an update', icon: NoteIcon, color: 'bg-blue-500/15 text-blue-400' },
  { key: 'task', label: 'Mark Task', sub: 'Update progress', icon: ChecklistIcon, color: 'bg-gold-500/15 text-gold-300' },
  { key: 'notify', label: 'Notify Team', sub: 'Send to contractors', icon: PeopleIcon, color: 'bg-violet-500/15 text-violet-400' },
]

const WMO_WEATHER = {
  0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Fog',
  51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
  61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
  71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
  80: 'Rain Showers', 81: 'Rain Showers', 82: 'Violent Showers',
  95: 'Thunderstorm',
}
function weatherIconFor(code) {
  if (code === 0 || code === 1) return SunIcon
  if ([61, 63, 65, 51, 53, 55, 80, 81, 82, 95].includes(code)) return RainIcon
  return CloudIcon
}

// Real current weather for the project's own location, from Open-Meteo's
// free/keyless geocoding + forecast APIs — not a fabricated number. Fails
// silently (returns null) so the UI just omits the Weather field rather
// than showing a fake placeholder when it can't resolve a real reading.
async function fetchWeatherFor(location) {
  if (!location) return null
  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`)
    const geoData = await geoRes.json()
    const place = geoData?.results?.[0]
    if (!place) return null
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current_weather=true`)
    const weatherData = await weatherRes.json()
    const cw = weatherData?.current_weather
    if (!cw) return null
    return { tempC: Math.round(cw.temperature), condition: WMO_WEATHER[cw.weathercode] || 'N/A', code: cw.weathercode }
  } catch {
    return null
  }
}

function initialsOf(name) {
  return (name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(iso) {
  const d = new Date(iso)
  return `${formatDate(iso)} · ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`
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

// A project's real status derived from its own progress % — no separate
// lifecycle field exists (or is editable) yet, so this is computed rather
// than fabricated: 0% is genuinely "Not Started", 100% is "Completed".
function projectStatusFor(percent) {
  if (percent >= 100) return { label: 'Completed', dot: 'bg-blue-400' }
  if (percent > 0) return { label: 'In Progress', dot: 'bg-emerald-400' }
  return { label: 'Not Started', dot: 'bg-ink/30' }
}

const CHART_RANGES = [
  { key: '3m', label: 'Last 3 Months', months: 3 },
  { key: '6m', label: 'Last 6 Months', months: 6 },
  { key: 'all', label: 'All Time', months: null },
]

// Real progress-over-time trend from the project's own update history — no
// synthetic data. A single series needs no legend/categorical validation
// (per the dataviz method).
function ProgressChart({ points, color }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const width = 600
  const height = 170
  const padX = 16
  const padY = 20

  const xs = points.map((p, i) => padX + (i / Math.max(1, points.length - 1)) * (width - padX * 2))
  const ys = points.map((p) => padY + (1 - p.progressPercent / 100) * (height - padY * 2))
  const coords = points.map((p, i) => ({ x: xs[i], y: ys[i], ...p }))
  const linePath = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = coords.length
    ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height - padY} L ${coords[0].x.toFixed(1)} ${height - padY} Z`
    : ''
  const active = hoverIdx !== null ? hoverIdx : coords.length - 1

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" onMouseLeave={() => setHoverIdx(null)}>
        <defs>
          <linearGradient id="progress-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((pct) => (
          <line
            key={pct}
            x1={padX} x2={width - padX}
            y1={padY + (1 - pct / 100) * (height - padY * 2)}
            y2={padY + (1 - pct / 100) * (height - padY * 2)}
            stroke="currentColor" className="text-ink/5" strokeWidth="1"
          />
        ))}
        <path d={areaPath} fill="url(#progress-trend-fill)" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((p, i) => (
          <g key={p.id || i}>
            <circle cx={p.x} cy={p.y} r={hoverIdx === i ? 4.5 : 3} fill={color} stroke="white" strokeWidth={hoverIdx === i ? 1.5 : 1} />
            <rect x={p.x - (width / coords.length) / 2} y={0} width={width / coords.length} height={height} fill="transparent" onMouseEnter={() => setHoverIdx(i)} />
          </g>
        ))}
        {coords[active] && (
          <>
            <line x1={coords[active].x} y1={padY} x2={coords[active].x} y2={height - padY} stroke={color} strokeOpacity="0.3" strokeWidth="1" />
            <g transform={`translate(${Math.min(Math.max(coords[active].x, 60), width - 60)}, ${Math.max(coords[active].y - 30, 12)})`}>
              <rect x="-46" y="-14" width="92" height="26" rx="7" fill={color} />
              <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="600" fill="white">
                {coords[active].progressPercent}% · {formatDate(coords[active].createdAt)}
              </text>
            </g>
          </>
        )}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-ink/35">
        <span>{formatDate(points[0]?.createdAt)}</span>
        <span>{formatDate(points[points.length - 1]?.createdAt)}</span>
      </div>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-ink/45">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} /> Project Progress
      </p>
    </div>
  )
}

const updateFormInitial = { title: '', description: '', progressPercent: '', location: '' }

function ProgressUpdatesPage() {
  const { theme } = usePreferences()
  const chartColor = theme === 'light' ? CHART_COLOR.light : CHART_COLOR.dark

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
  const [feedExpanded, setFeedExpanded] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [weather, setWeather] = useState(null)
  const [chartRange, setChartRange] = useState('6m')
  const [photoFiles, setPhotoFiles] = useState([])
  const [locatingUser, setLocatingUser] = useState(false)

  const loadProjects = async () => {
    const res = await apiFetch('/api/projects')
    return res.projects || []
  }

  useEffect(() => {
    ;(async () => {
      try {
        const list = await loadProjects()
        setProjects(list)
        if (list.length) setSelectedProjectId(list[0].id)
      } catch (err) {
        setError(err.message)
      } finally {
        setProjectsLoading(false)
      }
    })()
  }, [])

  // The project switcher's status dot is derived from progressPercent, which
  // changes when an update sets a new %, so the switcher list itself needs
  // refreshing too — not just this project's detail data — or it goes stale
  // (e.g. still shows "Not Started" right after posting a 50% update).
  const refreshProjectsList = async () => {
    try {
      setProjects(await loadProjects())
    } catch {
      // Non-fatal — the detail view below already has the fresh data.
    }
  }

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

  const project = data?.project
  const milestones = data?.milestones || []
  const updates = data?.updates || []
  const taskCounts = data?.taskCounts || { pending: 0, in_progress: 0, completed: 0 }
  const totalTasks = taskCounts.pending + taskCounts.in_progress + taskCounts.completed

  // Prefer the latest update's own captured location (real, per-update) over
  // the project's saved one, so weather reflects where work actually was.
  const weatherLocation = updates[0]?.location || project?.location
  useEffect(() => {
    setWeather(null)
    if (!weatherLocation) return
    let cancelled = false
    fetchWeatherFor(weatherLocation).then((w) => { if (!cancelled) setWeather(w) })
    return () => { cancelled = true }
  }, [weatherLocation])

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3200)
  }

  const schedule = useMemo(() => {
    if (!project?.startDate || !project?.expectedCompletion) return null
    const start = new Date(project.startDate).getTime()
    const end = new Date(project.expectedCompletion).getTime()
    if (end <= start) return null
    const elapsedRatio = Math.min(1, Math.max(0, (Date.now() - start) / (end - start)))
    const progressRatio = project.progressPercent / 100
    return { onTrack: progressRatio >= elapsedRatio - 0.1, elapsedRatio }
  }, [project])

  const daysLeft = useMemo(() => {
    if (!project?.expectedCompletion) return null
    return Math.ceil((new Date(project.expectedCompletion).getTime() - Date.now()) / 86400000)
  }, [project])

  const allChartPoints = useMemo(
    () =>
      [...updates]
        .filter((u) => u.progressPercent != null)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [updates]
  )
  const chartPoints = useMemo(() => {
    const range = CHART_RANGES.find((r) => r.key === chartRange)
    if (!range?.months) return allChartPoints
    const cutoff = Date.now() - range.months * 30 * 86400000
    return allChartPoints.filter((p) => new Date(p.createdAt).getTime() >= cutoff)
  }, [allChartPoints, chartRange])

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
    setPhotoFiles([])
    setUpdateError('')
    setShowUpdateModal(true)
  }

  // Optional current-location capture (spec: never force the permission
  // prompt — if it's denied or unavailable, the update just has no location
  // of its own and the UI falls back to the project's saved location).
  const detectUpdateLocation = () => {
    if (!navigator.geolocation) return
    setLocatingUser(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`)
          const data = await res.json()
          const place = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.state_district || data?.address?.state
          if (place) setUpdateForm((p) => ({ ...p, location: place }))
        } catch {
          // Silently ignore — location stays whatever the user typed (or blank).
        } finally {
          setLocatingUser(false)
        }
      },
      () => setLocatingUser(false),
      { timeout: 8000 }
    )
  }

  const removePhotoFile = (index) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index))
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
      const photoUrls = await uploadImages(photoFiles)
      await apiFetch(`/api/projects/${selectedProjectId}/progress-updates`, {
        method: 'POST',
        body: JSON.stringify({
          title: updateForm.title.trim(),
          description: updateForm.description.trim() || undefined,
          progressPercent: updateForm.progressPercent !== '' ? Number(updateForm.progressPercent) : undefined,
          location: updateForm.location.trim() || undefined,
          photoUrls,
        }),
      })
      setShowUpdateModal(false)
      showToast('Update posted')
      await Promise.all([loadProgress(selectedProjectId), refreshProjectsList()])
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

  const handleQuickAction = (key) => {
    if (key === 'task') return setTab('tasks')
    if (key === 'notify') return handleNotifyTeam()
    openModal()
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <DashboardHeader onMenuClick={onMenuClick} title="Progress Updates" subtitle="Track your project progress and receive updates." />
          </div>

          {projectsLoading ? (
            <div className="mt-16 flex justify-center"><Spinner className="h-6 w-6 text-ink/40" /></div>
          ) : (
            <>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-1 flex-wrap gap-2.5">
                  {projects.map((p) => {
                    const st = projectStatusFor(p.progressPercent)
                    const selected = selectedProjectId === p.id
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProjectId(p.id)}
                        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors duration-150 ${
                          selected ? 'border-gold-500/50 bg-gold-500/10' : 'border-ink/10 bg-navy-900/50 hover:border-ink/20'
                        }`}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink/60">
                          <HouseIcon className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-xs font-semibold text-ink">{p.name}</span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-ink/50">
                            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} /> {st.label}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                  <Link
                    to="/dashboard/projects"
                    className="flex items-center gap-1.5 rounded-xl border border-dashed border-ink/15 px-3.5 py-2.5 text-xs font-medium text-ink/50 hover:border-ink/30 hover:text-ink/80"
                  >
                    <PlusIcon className="h-3.5 w-3.5" /> Add Project
                  </Link>
                </div>
                <button onClick={openModal} className="flex shrink-0 items-center gap-1.5 rounded-full bg-gold-500 px-4 py-2.5 text-xs font-semibold text-charcoal hover:bg-gold-400">
                  <PlusIcon className="h-3.5 w-3.5" /> Add Update
                </button>
              </div>

              {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

              {dataLoading || !project ? (
                <div className="mt-16 flex justify-center"><Spinner className="h-6 w-6 text-ink/40" /></div>
              ) : (
                <>
                  {/* Stat tiles */}
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-navy-900/50 p-3.5">
                      <ProgressRing percent={project.progressPercent} size={56} stroke={6} />
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-ink/40">Overall Progress</p>
                        <p className="mt-0.5 text-sm font-semibold text-ink">{project.progressPercent}%</p>
                      </div>
                    </div>
                    {[
                      { label: 'Start Date', value: formatDate(project.startDate) || 'Not set', icon: CalendarTileIcon },
                      { label: 'Expected Completion', value: formatDate(project.expectedCompletion) || 'Not set', sub: daysLeft != null ? (daysLeft >= 0 ? `${daysLeft} days left` : `${-daysLeft} days overdue`) : null, icon: FlagTileIcon },
                      { label: 'Completed Tasks', value: `${taskCounts.completed} / ${totalTasks || 0}`, icon: CheckTileIcon },
                      { label: 'On Time', value: schedule ? (schedule.onTrack ? 'Yes' : 'No') : '—', accent: schedule ? (schedule.onTrack ? 'text-emerald-300' : 'text-red-400') : 'text-ink/50', icon: ClockTileIcon },
                      { label: 'Total Updates', value: updates.length >= 50 ? '50+' : updates.length, icon: BellTileIcon },
                    ].map((tile) => (
                      <div key={tile.label} className="rounded-2xl border border-ink/10 bg-navy-900/50 p-3.5">
                        <div className="flex items-center gap-1.5 text-ink/35">
                          <tile.icon className="h-3.5 w-3.5" />
                          <p className="text-[10px] font-medium uppercase tracking-wider">{tile.label}</p>
                        </div>
                        <p className={`mt-1.5 text-sm font-semibold ${tile.accent || 'text-ink'}`}>{tile.value}</p>
                        {tile.sub && <p className={`mt-0.5 text-[10px] ${schedule?.onTrack === false ? 'text-red-400/80' : 'text-emerald-400/80'}`}>{tile.sub}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Tabs — underline style */}
                  <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-b border-ink/10">
                    {TABS.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex items-center gap-1.5 border-b-2 pb-2.5 text-xs font-medium transition-colors duration-150 ${
                          tab === t.key ? 'border-gold-500 text-gold-300' : 'border-transparent text-ink/50 hover:text-ink'
                        }`}
                      >
                        <t.icon className="h-3.5 w-3.5" />
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* 3-column layout: tab content | latest update + quick actions | chart + feed */}
                  <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[300px_1fr_340px]">
                    {/* LEFT: active tab content */}
                    <div className="rounded-2xl border border-ink/10 bg-navy-900/50 p-5 xl:order-1">
                      {tab === 'timeline' && (
                        <div className="space-y-0">
                          {milestones.map((m, i) => {
                            const style = STATUS_STYLES[m.status]
                            return (
                              <div key={m.key} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  {m.status === 'completed' ? (
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                                      <CheckTileIcon className="h-4 w-4" />
                                    </span>
                                  ) : m.status === 'in_progress' ? (
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-500 text-charcoal">
                                      <span className="h-2 w-2 rounded-full bg-charcoal" />
                                    </span>
                                  ) : (
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink/15 text-ink/25">
                                      <span className="h-1.5 w-1.5 rounded-full bg-ink/25" />
                                    </span>
                                  )}
                                  {i < milestones.length - 1 && <span className="w-px flex-1 bg-ink/10" />}
                                </div>
                                <div className="pb-6 pt-0.5">
                                  <p className="text-sm font-medium text-ink">{m.label}</p>
                                  <p className={`text-xs font-medium ${style.text}`}>{style.label}</p>
                                  {(m.startDate || m.endDate) && (
                                    <p className="mt-0.5 text-[11px] text-ink/35">{formatDate(m.startDate)} – {formatDate(m.endDate)}</p>
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
                          <div className="grid grid-cols-2 gap-2.5">
                            {photos.map((p, i) => (
                              <button
                                key={i}
                                onClick={() => setLightboxUrl(p.url)}
                                className="overflow-hidden rounded-xl border border-ink/10 bg-navy-950/40 text-left transition-transform duration-150 hover:scale-[1.02] hover:border-gold-500/30"
                              >
                                <img src={p.url} alt={p.updateTitle} className="h-24 w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
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
                                <div key={task.id} className="rounded-xl border border-ink/10 bg-navy-950/40 p-3">
                                  <div className="flex items-center gap-2.5">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink/50">
                                      <TypeIcon className="h-3.5 w-3.5" />
                                    </span>
                                    <p className="min-w-0 flex-1 truncate text-sm text-ink/90">{task.title}</p>
                                  </div>
                                  <div className="mt-2 flex items-center justify-between gap-2">
                                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium}`}>{task.priority}</span>
                                    <button
                                      onClick={() => cycleTaskStatus(task)}
                                      disabled={taskActionId === task.id}
                                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${style.bg} ${style.text} disabled:opacity-50`}
                                    >
                                      {taskActionId === task.id && <Spinner className="h-3 w-3" />}
                                      {style.label}
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      )}

                      {tab === 'reports' && (
                        <div className="space-y-3">
                          {[
                            { label: 'Milestones Completed', value: `${milestones.filter((m) => m.status === 'completed').length}/${milestones.length}` },
                            { label: 'Tasks Completed', value: `${taskCounts.completed}/${totalTasks || 0}` },
                            { label: 'Updates Logged', value: updates.length >= 50 ? '50+' : updates.length },
                            { label: 'Last Update', value: latestUpdate ? timeAgo(latestUpdate.createdAt) : 'None yet' },
                            { label: 'Overall Status', value: schedule ? (schedule.onTrack ? 'On Track' : 'Behind Schedule') : 'Not enough data' },
                          ].map((r) => (
                            <div key={r.label} className="rounded-xl border border-ink/10 bg-navy-950/40 p-3">
                              <p className="text-[10px] font-medium uppercase tracking-wider text-ink/40">{r.label}</p>
                              <p className="mt-1 text-sm font-semibold text-ink">{r.value}</p>
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
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500/15 text-[9px] font-semibold text-gold-300">{initialsOf(g.author)}</span>
                                  <p className="text-xs font-semibold text-ink">{g.author} <span className="font-normal text-ink/40">· {g.list.length}</span></p>
                                </div>
                                <div className="mt-2 space-y-1.5 border-l-2 border-ink/10 pl-3">
                                  {g.list.slice(0, 4).map((u) => (
                                    <p key={u.id} className="text-[11px] text-ink/60">
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

                    {/* MIDDLE: Latest Update + Quick Update */}
                    <div className="space-y-4 xl:order-2">
                      {latestUpdate && (
                        <div className="rounded-2xl border border-gold-500/20 bg-navy-900/50 p-5">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                                <NoteIcon className="h-4.5 w-4.5" />
                              </span>
                              <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-ink/40">Latest Update</p>
                                <p className="text-[11px] text-ink/35">{formatDateTime(latestUpdate.createdAt)}</p>
                              </div>
                            </div>
                            {latestUpdate.progressPercent != null ? (
                              <span className="rounded-full bg-gold-500/10 px-2.5 py-1 text-[10px] font-semibold text-gold-300">
                                {schedule?.onTrack === false ? 'Behind Schedule' : 'On Schedule'}
                              </span>
                            ) : (
                              <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[10px] font-medium text-ink/45">Note</span>
                            )}
                          </div>

                          <p className="mt-3 font-display text-base font-semibold text-ink">
                            {latestUpdate.title}
                            {latestUpdate.progressPercent != null && !latestUpdate.title.includes('%') ? ` - ${latestUpdate.progressPercent}% Complete` : ''}
                          </p>
                          {latestUpdate.description && <p className="mt-1.5 text-sm text-ink/60">{latestUpdate.description}</p>}

                          {latestUpdate.photoUrls?.length > 0 && (
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              {latestUpdate.photoUrls.slice(0, 3).map((url, i) => (
                                <button key={i} onClick={() => setLightboxUrl(url)}>
                                  <img src={url} alt="" className="h-24 w-full rounded-lg object-cover hover:opacity-90" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-ink/10 pt-3 sm:grid-cols-3">
                            <div className="flex items-center gap-2 text-xs text-ink/60">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink/50"><PersonIcon className="h-3.5 w-3.5" /></span>
                              <span><span className="block text-[10px] text-ink/35">Updated by</span>{latestUpdate.authorName}</span>
                            </div>
                            {(latestUpdate.location || project.location) && (
                              <div className="flex items-center gap-2 text-xs text-ink/60">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink/50"><LocationDotIcon className="h-3.5 w-3.5" /></span>
                                <span><span className="block text-[10px] text-ink/35">Location</span>{latestUpdate.location || project.location}</span>
                              </div>
                            )}
                            {weather && (
                              <div className="flex items-center gap-2 text-xs text-ink/60">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink/50">
                                  {(() => { const WIcon = weatherIconFor(weather.code); return <WIcon className="h-3.5 w-3.5" /> })()}
                                </span>
                                <span><span className="block text-[10px] text-ink/35">Weather</span>{weather.condition}, {weather.tempC}°C</span>
                              </div>
                            )}
                          </div>

                          {latestUpdate.photoUrls?.length > 0 && (
                            <button onClick={() => setTab('photos')} className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gold-300 hover:text-gold-200">
                              View All Photos <span aria-hidden>→</span>
                            </button>
                          )}
                        </div>
                      )}

                      <div className="rounded-2xl border border-ink/10 bg-navy-900/50 p-5">
                        <p className="text-sm font-semibold text-ink">Quick Update</p>
                        <div className="mt-3 grid grid-cols-2 gap-2.5">
                          {QUICK_UPDATE_ACTIONS.map((a) => (
                            <button
                              key={a.key}
                              onClick={() => handleQuickAction(a.key)}
                              className="flex flex-col items-start gap-2 rounded-xl border border-ink/10 bg-navy-950/40 p-3 text-left transition-colors duration-150 hover:border-ink/25"
                            >
                              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.color}`}>
                                <a.icon className="h-4 w-4" />
                              </span>
                              <span>
                                <span className="block text-xs font-semibold text-ink">{a.label}</span>
                                <span className="block text-[10px] text-ink/40">{a.sub}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: Progress Chart + Recent Updates */}
                    <div className="space-y-4 xl:order-3">
                      <div className="rounded-2xl border border-ink/10 bg-navy-900/50 p-5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-ink">Progress Chart</p>
                          <select
                            value={chartRange}
                            onChange={(e) => setChartRange(e.target.value)}
                            className="rounded-lg border border-ink/10 bg-navy-950/40 px-2 py-1 text-[10px] text-ink/60 outline-none"
                          >
                            {CHART_RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                          </select>
                        </div>
                        {chartPoints.length < 2 ? (
                          <p className="mt-6 text-center text-sm text-ink/40">Post at least two updates with a progress % to see the trend.</p>
                        ) : (
                          <div className="mt-3"><ProgressChart points={chartPoints} color={chartColor} /></div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-ink/10 bg-navy-900/50 p-5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-ink">Recent Updates</p>
                          {updates.length > 0 && (
                            <button onClick={() => setFeedExpanded((v) => !v)} className="text-xs font-medium text-gold-300 hover:text-gold-200">
                              {feedExpanded ? 'Show Less' : 'View All'}
                            </button>
                          )}
                        </div>

                        {feedExpanded && updates.length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <select value={feedAuthor} onChange={(e) => setFeedAuthor(e.target.value)} className="rounded-full border border-ink/10 bg-navy-950/40 px-2.5 py-1 text-[10px] text-ink/70 outline-none">
                              <option value="all">All Authors</option>
                              {feedAuthors.map((a) => <option key={a} value={a}>{a}</option>)}
                            </select>
                            <select value={feedSort} onChange={(e) => setFeedSort(e.target.value)} className="rounded-full border border-ink/10 bg-navy-950/40 px-2.5 py-1 text-[10px] text-ink/70 outline-none">
                              <option value="newest">Newest</option>
                              <option value="oldest">Oldest</option>
                            </select>
                            <button
                              onClick={() => setFeedPhotosOnly((v) => !v)}
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${feedPhotosOnly ? 'border-gold-500/50 bg-gold-500/10 text-gold-300' : 'border-ink/10 text-ink/60'}`}
                            >
                              With Photos
                            </button>
                          </div>
                        )}

                        {updates.length === 0 ? (
                          <p className="mt-3 text-sm text-ink/40">No updates posted yet.</p>
                        ) : (
                          <div className="mt-3 space-y-2.5">
                            {(feedExpanded ? filteredFeed : updates).slice(0, feedExpanded ? 20 : 5).map((u) => (
                              <div key={u.id} className="flex items-center gap-2.5">
                                {u.photoUrls?.[0] ? (
                                  <img src={u.photoUrls[0]} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                                ) : (
                                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink/30">
                                    <DocThumbIcon className="h-4 w-4" />
                                  </span>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs text-ink/85">{u.title}</p>
                                  <p className="text-[10px] text-ink/40">{formatDateTime(u.createdAt)}</p>
                                </div>
                                {u.progressPercent != null && (
                                  <span className="shrink-0 rounded-full bg-gold-500/10 px-1.5 py-0.5 text-[9px] font-medium text-gold-300">{u.progressPercent}%</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
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
                    <div>
                      <label className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-ink/60">
                        Location (optional)
                        <button type="button" onClick={detectUpdateLocation} disabled={locatingUser} className="flex items-center gap-1 text-[10px] font-medium normal-case text-gold-300 hover:text-gold-200 disabled:opacity-50">
                          {locatingUser && <Spinner className="h-3 w-3" />}
                          <LocationDotIcon className="h-3 w-3" /> Use current location
                        </button>
                      </label>
                      <input
                        value={updateForm.location}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, location: e.target.value }))}
                        placeholder={project?.location || 'e.g. Site — Block A'}
                        className="w-full rounded-lg border border-ink/15 bg-navy-900/60 px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold-500/70"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink/60">Site Photos (optional)</label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        multiple
                        onChange={(e) => setPhotoFiles((prev) => [...prev, ...Array.from(e.target.files || [])].slice(0, 6))}
                        className="block w-full text-xs text-ink/60 file:mr-3 file:rounded-lg file:border-0 file:bg-gold-500/15 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-gold-300 hover:file:bg-gold-500/25"
                      />
                      {photoFiles.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {photoFiles.map((file, i) => (
                            <div key={i} className="relative">
                              <img src={URL.createObjectURL(file)} alt="" className="h-14 w-14 rounded-lg object-cover" />
                              <button type="button" onClick={() => removePhotoFile(i)} className="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] text-white">✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
