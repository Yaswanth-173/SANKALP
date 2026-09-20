import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import Spinner from '../components/Spinner.jsx'
import FormField from '../components/FormField.jsx'
import { ProjectsIcon } from '../components/dashboard/icons.jsx'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { apiFetch } from '../utils/api.js'
import { uploadDocument, resolveFileUrl } from '../utils/upload.js'
import { supervisorNavItems } from '../utils/supervisorNav.js'
import { getSelectedProjectId, setSelectedProjectId as persistSelectedProjectId } from '../utils/selectedProject.js'

// The default 6 names created by ensureSchema.js — used only as a render
// placeholder before /api/budget-categories resolves, and as the fallback
// if that project has literally never had any category activity. The
// admin-managed list from the API is the actual source of truth (see
// `categoryNames` state below); this is not a hardcoded master list.
const DEFAULT_BUDGET_CATEGORIES = ['Foundation', 'Structure', 'Electrical', 'Plumbing', 'Finishing', 'Others']
const PAYMENT_MODES = ['cash', 'upi', 'card', 'bank_transfer']

// Fixed categorical hue order, validated with the dataviz skill's validator
// against this app's actual card surfaces (dark #0a0e1a / light #ffffff) —
// see the chat history for the exact `validate_palette.js` runs. Every
// one of the default 6 categories always gets the same slot, never a
// cycled/generated hue. A category an admin adds beyond these 6 falls back
// to a neutral, unvalidated gray (FALLBACK_CATEGORY_COLOR) rather than a
// made-up hue — re-validating an unbounded admin-defined palette isn't
// something that can happen automatically at request time.
const CATEGORY_COLORS = {
  dark: { Foundation: '#3987e5', Structure: '#d95926', Electrical: '#199e70', Plumbing: '#c98500', Finishing: '#d55181', Others: '#008300' },
  light: { Foundation: '#2a78d6', Structure: '#eb6834', Electrical: '#1baf7a', Plumbing: '#eda100', Finishing: '#e87ba4', Others: '#008300' },
}
const FALLBACK_CATEGORY_COLOR = { dark: '#8b93a7', light: '#6b7280' }
// Budgeted vs Spent — also validated against both modes. "Spent" reuses the
// same gold/amber family the rest of the app already uses for money/price.
const BAR_COLORS = {
  dark: { budgeted: '#3987e5', spent: '#c98500' },
  light: { budgeted: '#2a78d6', spent: '#eda100' },
}

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'planner', label: 'Budget Planner' },
  { key: 'comparison', label: 'Cost Comparison' },
  { key: 'reports', label: 'Reports' },
]

function BudgetBarChart({ categories, colors }) {
  const [hover, setHover] = useState(null)
  const width = 640
  const height = 230
  const padL = 8
  const padB = 34
  const padT = 16
  const max = Math.max(1, ...categories.flatMap((c) => [c.budgetedAmount, c.spentAmount]))
  const groupWidth = (width - padL * 2) / categories.length
  const barWidth = groupWidth * 0.3
  const plotH = height - padT - padB

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-xs text-ink/60">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors.budgeted }} /> Budgeted</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors.spent }} /> Spent</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" onMouseLeave={() => setHover(null)}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={padL} x2={width - padL} y1={padT + plotH * (1 - f)} y2={padT + plotH * (1 - f)} stroke="currentColor" className="text-ink/5" strokeWidth="1" />
        ))}
        {categories.map((c, i) => {
          const gx = padL + i * groupWidth + groupWidth / 2
          const bH = (c.budgetedAmount / max) * plotH
          const sH = (c.spentAmount / max) * plotH
          return (
            <g key={c.category}>
              <rect
                x={gx - barWidth - 2}
                y={padT + plotH - bH}
                width={barWidth}
                height={bH}
                rx="3"
                fill={colors.budgeted}
                onMouseEnter={() => setHover({ category: c.category, label: 'Budgeted', value: c.budgetedAmount })}
              />
              <rect
                x={gx + 2}
                y={padT + plotH - sH}
                width={barWidth}
                height={sH}
                rx="3"
                fill={colors.spent}
                onMouseEnter={() => setHover({ category: c.category, label: 'Spent', value: c.spentAmount })}
              />
              <text x={gx} y={height - 12} textAnchor="middle" className="fill-current text-ink/45" fontSize="10">{c.category}</text>
            </g>
          )
        })}
      </svg>
      <p className="mt-1 h-4 text-center text-xs text-ink/60">
        {hover ? <>{hover.category} — {hover.label}: <span className="font-semibold text-gold-300">{formatPrice(hover.value)}</span></> : ' '}
      </p>
    </div>
  )
}

function ExpenseDonut({ categories, colors }) {
  const [hover, setHover] = useState(null)
  const total = categories.reduce((s, c) => s + c.spentAmount, 0)
  const size = 168
  const stroke = 24
  const r = (size - stroke) / 2
  const C = 2 * Math.PI * r
  let cumulative = 0

  if (total <= 0) {
    return <p className="py-10 text-center text-sm text-ink/40">No expenses logged yet — add one to see the breakdown.</p>
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" onMouseLeave={() => setHover(null)}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-ink/5" strokeWidth={stroke} />
          {categories.filter((c) => c.spentAmount > 0).map((c) => {
            const frac = c.spentAmount / total
            const dash = Math.max(0, frac * C - 2)
            const offset = -cumulative
            cumulative += frac * C
            return (
              <circle
                key={c.category}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={colors[c.category]}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={offset}
                onMouseEnter={() => setHover(c)}
                style={{ cursor: 'pointer' }}
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-base font-bold text-ink">{formatPrice(total)}</span>
          <span className="text-[10px] text-ink/40">Total Spent</span>
        </div>
      </div>
      <div className="flex-1 space-y-1.5">
        {categories.map((c) => {
          const pct = total > 0 ? Math.round((c.spentAmount / total) * 100) : 0
          return (
            <div key={c.category} className={`flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-xs transition-colors ${hover?.category === c.category ? 'bg-ink/5' : ''}`}>
              <span className="flex items-center gap-2 text-ink/70">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: colors[c.category] }} />
                {c.category}
              </span>
              <span className="text-ink/50">{formatPrice(c.spentAmount)} <span className="text-ink/30">({pct}%)</span></span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const expenseFormInitial = {
  category: '', subcategory: '', description: '', amount: '', paymentMode: 'cash', status: 'paid',
  expenseDate: new Date().toISOString().slice(0, 10), vendor: '', material: '', invoiceNumber: '', notes: '',
}

const filtersInitial = { dateFrom: '', dateTo: '', category: 'all', paymentMode: 'all', minAmount: '', maxAmount: '', status: 'all' }

// 75/90/100%+ thresholds, computed live from real spend vs budget — never
// stored, so there's no separate "already notified" state to manage and
// therefore no risk of duplicate alerts (the concern the spec calls out).
function budgetAlertFor(category) {
  if (!category.budgetedAmount) return null
  const pct = (category.spentAmount / category.budgetedAmount) * 100
  if (pct > 100) return { level: 'critical', text: `${category.category} expenses have exceeded the allocated budget by ${formatPrice(category.spentAmount - category.budgetedAmount)}.` }
  if (pct >= 100) return { level: 'critical', text: `${category.category} budget is fully utilized.` }
  if (pct >= 90) return { level: 'warning', text: `${category.category} budget is ${Math.round(pct)}% utilized.` }
  if (pct >= 75) return { level: 'notice', text: `${category.category} budget is ${Math.round(pct)}% utilized.` }
  return null
}

function BudgetExpensesPage() {
  const { theme } = usePreferences()
  const { user } = useAuth()
  const isCustomer = user?.role === 'customer'
  const roleSidebarProps = user?.role === 'supervisor' ? { navItems: supervisorNavItems } : undefined
  const barColors = theme === 'light' ? BAR_COLORS.light : BAR_COLORS.dark

  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState(null)

  // The admin-managed master list (GET /api/budget-categories) — the
  // frontend holds no hardcoded source of truth for what categories exist,
  // only this placeholder default shown for the instant before the real
  // list loads.
  const [categoryNames, setCategoryNames] = useState(DEFAULT_BUDGET_CATEGORIES)
  useEffect(() => {
    ;(async () => {
      try {
        const res = await apiFetch('/api/budget-categories')
        const names = (res.categories || []).map((c) => c.name)
        if (names.length) setCategoryNames(names)
      } catch {
        // Non-fatal — the placeholder default keeps the page usable.
      }
    })()
  }, [])

  const colors = useMemo(() => {
    const base = theme === 'light' ? CATEGORY_COLORS.light : CATEGORY_COLORS.dark
    const fallback = theme === 'light' ? FALLBACK_CATEGORY_COLOR.light : FALLBACK_CATEGORY_COLOR.dark
    const merged = { ...base }
    for (const name of categoryNames) if (!merged[name]) merged[name] = fallback
    return merged
  }, [theme, categoryNames])

  const [overview, setOverview] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [tab, setTab] = useState('overview')
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expenseForm, setExpenseForm] = useState(expenseFormInitial)
  const [editingExpenseId, setEditingExpenseId] = useState(null)
  const [existingReceiptUrl, setExistingReceiptUrl] = useState(null)
  const [receiptFile, setReceiptFile] = useState(null)
  const [expenseError, setExpenseError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [toast, setToast] = useState(null)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(filtersInitial)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Debounced search — waits for a pause in typing before actually filtering.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const [plannerAmounts, setPlannerAmounts] = useState({})
  const [plannerTotalBudget, setPlannerTotalBudget] = useState('')
  const [savingPlanner, setSavingPlanner] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await apiFetch('/api/projects')
        const list = res.projects || []
        setProjects(list)
        const remembered = getSelectedProjectId()
        const stillValid = list.find((p) => p.id === remembered)
        const next = stillValid ? stillValid.id : list[0]?.id
        if (next) {
          setSelectedProjectId(next)
          persistSelectedProjectId(next)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setProjectsLoading(false)
      }
    })()
  }, [])

  const loadBudget = async (projectId) => {
    if (!projectId) return
    setLoading(true)
    setError('')
    try {
      const [overviewRes, expensesRes] = await Promise.all([
        apiFetch(`/api/projects/${projectId}/budget`),
        apiFetch(`/api/projects/${projectId}/expenses`),
      ])
      const safeOverview = overviewRes?.categories
        ? overviewRes
        : { totalBudget: 0, totalSpent: 0, remaining: 0, totalExpenseCount: 0, categories: categoryNames.map((category) => ({ category, budgetedAmount: 0, spentAmount: 0 })), recentExpenses: [] }
      setOverview(safeOverview)
      setExpenses(expensesRes.expenses || [])
      setPlannerAmounts(Object.fromEntries(safeOverview.categories.map((c) => [c.category, String(c.budgetedAmount || '')])))
      setPlannerTotalBudget(safeOverview.totalBudget ? String(safeOverview.totalBudget) : '')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedProjectId) loadBudget(selectedProjectId)
  }, [selectedProjectId])

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3200)
  }

  const openAddExpense = () => {
    setEditingExpenseId(null)
    setExpenseForm({ ...expenseFormInitial, category: categoryNames[0] || '' })
    setExistingReceiptUrl(null)
    setReceiptFile(null)
    setExpenseError('')
    setShowExpenseModal(true)
  }

  const openEditExpense = (expense) => {
    setEditingExpenseId(expense.id)
    setExpenseForm({
      category: expense.category,
      subcategory: expense.subcategory || '',
      description: expense.description,
      amount: String(expense.amount),
      paymentMode: expense.paymentMode,
      status: expense.status,
      expenseDate: expense.expenseDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      vendor: expense.vendor || '',
      material: expense.material || '',
      invoiceNumber: expense.invoiceNumber || '',
      notes: expense.notes || '',
    })
    setExistingReceiptUrl(expense.receiptUrl || null)
    setReceiptFile(null)
    setExpenseError('')
    setShowExpenseModal(true)
  }

  const handleSubmitExpense = async (e) => {
    e.preventDefault()
    if (submitting) return
    const amountNum = Number(expenseForm.amount)
    if (!expenseForm.description.trim() || !Number.isFinite(amountNum) || amountNum <= 0) {
      setExpenseError('Enter a description and a valid amount')
      return
    }
    setSubmitting(true)
    setExpenseError('')
    try {
      const receiptUrl = receiptFile ? await uploadDocument(selectedProjectId, receiptFile) : undefined
      const body = { ...expenseForm, amount: amountNum, receiptUrl }
      if (editingExpenseId) {
        await apiFetch(`/api/projects/${selectedProjectId}/expenses/${editingExpenseId}`, { method: 'PUT', body: JSON.stringify(body) })
        showToast('Expense updated')
      } else {
        await apiFetch(`/api/projects/${selectedProjectId}/expenses`, { method: 'POST', body: JSON.stringify(body) })
        showToast('Expense added')
      }
      setShowExpenseModal(false)
      setExpenseForm(expenseFormInitial)
      setEditingExpenseId(null)
      await loadBudget(selectedProjectId)
    } catch (err) {
      setExpenseError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteExpense = async (expenseId) => {
    setDeletingId(expenseId)
    try {
      await apiFetch(`/api/projects/${selectedProjectId}/expenses/${expenseId}`, { method: 'DELETE' })
      showToast('Expense deleted')
      await loadBudget(selectedProjectId)
    } catch (err) {
      showToast(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSavePlanner = async () => {
    setSavingPlanner(true)
    try {
      await apiFetch(`/api/projects/${selectedProjectId}/budget`, {
        method: 'PUT',
        body: JSON.stringify({
          categories: categoryNames.map((category) => ({ category, budgetedAmount: Number(plannerAmounts[category]) || 0 })),
          totalBudget: plannerTotalBudget !== '' ? Number(plannerTotalBudget) : undefined,
        }),
      })
      showToast('Budget updated')
      await loadBudget(selectedProjectId)
    } catch (err) {
      showToast(err.message)
    } finally {
      setSavingPlanner(false)
    }
  }

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (search) {
        const haystack = `${e.description} ${e.vendor || ''} ${e.invoiceNumber || ''} ${e.category} ${e.material || ''} ${e.subcategory || ''}`.toLowerCase()
        if (!haystack.includes(search)) return false
      }
      if (filters.category !== 'all' && e.category !== filters.category) return false
      if (filters.paymentMode !== 'all' && e.paymentMode !== filters.paymentMode) return false
      if (filters.status !== 'all' && e.status !== filters.status) return false
      if (filters.dateFrom && e.expenseDate < filters.dateFrom) return false
      if (filters.dateTo && e.expenseDate > filters.dateTo) return false
      if (filters.minAmount !== '' && e.amount < Number(filters.minAmount)) return false
      if (filters.maxAmount !== '' && e.amount > Number(filters.maxAmount)) return false
      return true
    })
  }, [expenses, search, filters])

  // Category-level "budget vs actual" report, straight from the same live
  // numbers the charts use.
  const handleExportReportCsv = () => {
    if (!overview) return
    const header = ['Category', 'Budgeted', 'Spent', 'Remaining', 'Percent Used']
    const rows = overview.categories.map((c) => [
      c.category, c.budgetedAmount, c.spentAmount, c.budgetedAmount - c.spentAmount,
      c.budgetedAmount > 0 ? `${Math.round((c.spentAmount / c.budgetedAmount) * 100)}%` : 'n/a',
    ])
    rows.push(['TOTAL', overview.totalBudget, overview.totalSpent, overview.remaining,
      overview.totalBudget > 0 ? `${Math.round((overview.totalSpent / overview.totalBudget) * 100)}%` : 'n/a'])
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget-report-${selectedProjectId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // PDF via the browser's own print-to-PDF rather than pulling in a PDF
  // library — same output, no extra dependency.
  const handleExportReportPdf = () => window.print()

  const handleExportCsv = () => {
    const header = ['Date', 'Category', 'Description', 'Amount', 'Payment Mode', 'Status', 'Vendor', 'Invoice Number']
    const rows = filteredExpenses.map((e) => [
      e.expenseDate, e.category, `"${e.description.replace(/"/g, '""')}"`, e.amount, e.paymentMode, e.status,
      `"${(e.vendor || '').replace(/"/g, '""')}"`, e.invoiceNumber || '',
    ])
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${selectedProjectId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const reportStats = useMemo(() => {
    if (!overview || expenses.length === 0) return null
    const byCategory = [...overview.categories].sort((a, b) => b.spentAmount - a.spentAmount)
    const topCategory = byCategory[0]
    const paidCount = expenses.filter((e) => e.status === 'paid').length
    const pendingCount = expenses.filter((e) => e.status === 'pending').length
    const avgAmount = expenses.reduce((s, e) => s + e.amount, 0) / expenses.length
    const overBudget = overview.categories.filter((c) => c.budgetedAmount > 0 && c.spentAmount > c.budgetedAmount)
    const utilization = overview.totalBudget > 0 ? Math.round((overview.totalSpent / overview.totalBudget) * 100) : null
    return { topCategory, paidCount, pendingCount, avgAmount, overBudget, utilization }
  }, [overview, expenses])

  if (!projectsLoading && projects.length === 0) {
    return (
      <DashboardShell sidebarProps={roleSidebarProps}>
        {({ onMenuClick }) => (
          <>
            <DashboardHeader onMenuClick={onMenuClick} title="Budget & Expenses" subtitle="Calculate budget, track expenses and manage project costs." />
            <div className="mt-16 flex flex-col items-center gap-3 text-center text-ink/40">
              <ProjectsIcon className="h-10 w-10" />
              {isCustomer ? (
                <>
                  <p className="text-sm">Create a project first to start tracking its budget.</p>
                  <Link to="/dashboard/projects" className="mt-1 rounded-full bg-gold-500 px-4 py-2 text-xs font-semibold text-charcoal hover:bg-gold-400">
                    + New Project
                  </Link>
                </>
              ) : (
                <p className="text-sm">You haven't been assigned to any projects yet.</p>
              )}
            </div>
          </>
        )}
      </DashboardShell>
    )
  }

  return (
    <DashboardShell sidebarProps={roleSidebarProps}>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader onMenuClick={onMenuClick} title="Budget & Expenses" subtitle="Calculate budget, track expenses and manage project costs." />

          {projectsLoading ? (
            <div className="mt-16 flex justify-center"><Spinner className="h-6 w-6 text-ink/40" /></div>
          ) : (
            <>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedProjectId(p.id); persistSelectedProjectId(p.id) }}
                      className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors duration-150 ${
                        selectedProjectId === p.id ? 'border-gold-500/50 bg-gold-500/10 text-gold-300' : 'border-ink/10 text-ink/60 hover:border-ink/20'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleExportCsv} disabled={filteredExpenses.length === 0} className="rounded-full border border-ink/15 px-4 py-2 text-xs font-medium text-ink/70 hover:border-ink/30 disabled:opacity-40">Export</button>
                  <button onClick={openAddExpense} className="rounded-full bg-gold-500 px-4 py-2 text-xs font-semibold text-charcoal hover:bg-gold-400">+ Add Expense</button>
                </div>
              </div>

              {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

              {loading || !overview ? (
                <div className="mt-16 flex justify-center"><Spinner className="h-6 w-6 text-ink/40" /></div>
              ) : (
                <>
                  <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                      { label: 'Total Budget', value: formatPrice(overview.totalBudget) },
                      { label: 'Total Spent', value: formatPrice(overview.totalSpent) },
                      { label: 'Remaining Budget', value: formatPrice(overview.remaining), accent: overview.remaining < 0 ? 'text-red-400' : 'text-emerald-300' },
                      { label: 'Total Expenses', value: overview.totalExpenseCount },
                    ].map((tile) => (
                      <div key={tile.label} className="rounded-2xl border border-ink/10 bg-navy-900/50 p-4">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-ink/40">{tile.label}</p>
                        <p className={`mt-1.5 font-display text-lg font-semibold ${tile.accent || 'text-ink'}`}>{tile.value}</p>
                      </div>
                    ))}
                  </div>

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
                    {tab === 'overview' && (
                      <div>
                        {(() => {
                          const alerts = overview.categories.map(budgetAlertFor).filter(Boolean)
                          if (alerts.length === 0) return null
                          const styleFor = { critical: 'border-red-400/30 bg-red-400/5 text-red-300', warning: 'border-amber-400/30 bg-amber-400/5 text-amber-300', notice: 'border-gold-500/30 bg-gold-500/5 text-gold-300' }
                          return (
                            <div className="mb-5 space-y-2">
                              {alerts.map((a, i) => (
                                <div key={i} className={`rounded-xl border px-4 py-2.5 text-xs font-medium ${styleFor[a.level]}`}>{a.text}</div>
                              ))}
                            </div>
                          )
                        })()}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                          <div>
                            <p className="text-sm font-semibold text-ink">Budget vs Expenses</p>
                            <div className="mt-2"><BudgetBarChart categories={overview.categories} colors={barColors} /></div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ink">Expense Breakdown</p>
                            <div className="mt-3"><ExpenseDonut categories={overview.categories} colors={colors} /></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {tab === 'expenses' && (
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search description, vendor, invoice #..."
                            className="min-w-[220px] flex-1 rounded-full border border-ink/15 bg-navy-950/40 px-4 py-2 text-xs text-ink outline-none placeholder:text-ink/35"
                          />
                          <button
                            onClick={() => setFiltersOpen((v) => !v)}
                            className={`rounded-full border px-3.5 py-2 text-xs font-medium ${filtersOpen ? 'border-gold-500/50 bg-gold-500/10 text-gold-300' : 'border-ink/10 text-ink/60'}`}
                          >
                            Filters
                          </button>
                        </div>

                        {filtersOpen && (
                          <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-ink/10 bg-navy-950/40 p-3 sm:grid-cols-4">
                            <div>
                              <label className="mb-1 block text-[10px] uppercase tracking-wider text-ink/40">From</label>
                              <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))} className="w-full rounded-lg border border-ink/15 bg-navy-900/60 px-2 py-1.5 text-xs text-ink outline-none" />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] uppercase tracking-wider text-ink/40">To</label>
                              <input type="date" value={filters.dateTo} onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))} className="w-full rounded-lg border border-ink/15 bg-navy-900/60 px-2 py-1.5 text-xs text-ink outline-none" />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] uppercase tracking-wider text-ink/40">Category</label>
                              <select value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))} className="w-full rounded-lg border border-ink/15 bg-navy-900/60 px-2 py-1.5 text-xs text-ink outline-none">
                                <option value="all">All</option>
                                {categoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] uppercase tracking-wider text-ink/40">Payment Mode</label>
                              <select value={filters.paymentMode} onChange={(e) => setFilters((p) => ({ ...p, paymentMode: e.target.value }))} className="w-full rounded-lg border border-ink/15 bg-navy-900/60 px-2 py-1.5 text-xs text-ink outline-none">
                                <option value="all">All</option>
                                {PAYMENT_MODES.map((m) => <option key={m} value={m} className="capitalize">{m.replace(/_/g, ' ')}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] uppercase tracking-wider text-ink/40">Min Amount</label>
                              <input type="number" value={filters.minAmount} onChange={(e) => setFilters((p) => ({ ...p, minAmount: e.target.value }))} className="w-full rounded-lg border border-ink/15 bg-navy-900/60 px-2 py-1.5 text-xs text-ink outline-none" />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] uppercase tracking-wider text-ink/40">Max Amount</label>
                              <input type="number" value={filters.maxAmount} onChange={(e) => setFilters((p) => ({ ...p, maxAmount: e.target.value }))} className="w-full rounded-lg border border-ink/15 bg-navy-900/60 px-2 py-1.5 text-xs text-ink outline-none" />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] uppercase tracking-wider text-ink/40">Status</label>
                              <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} className="w-full rounded-lg border border-ink/15 bg-navy-900/60 px-2 py-1.5 text-xs text-ink outline-none">
                                <option value="all">All</option>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                              </select>
                            </div>
                            <div className="flex items-end">
                              <button onClick={() => setFilters(filtersInitial)} className="w-full rounded-lg border border-ink/15 py-1.5 text-xs font-medium text-ink/60 hover:border-ink/30">Clear Filters</button>
                            </div>
                          </div>
                        )}

                        <p className="mt-3 text-[11px] text-ink/35">Showing {filteredExpenses.length} of {expenses.length} expenses</p>

                        {expenses.length === 0 ? (
                          <p className="py-8 text-center text-sm text-ink/40">No expenses recorded yet.</p>
                        ) : filteredExpenses.length === 0 ? (
                          <p className="py-8 text-center text-sm text-ink/40">No expenses match these filters.</p>
                        ) : (
                          <div className="mt-2 overflow-x-auto">
                            <table className="w-full text-left text-sm">
                              <thead className="text-xs uppercase tracking-wider text-ink/40">
                                <tr>
                                  <th className="px-2 py-2">Date</th>
                                  <th className="px-2 py-2">Category</th>
                                  <th className="px-2 py-2">Description</th>
                                  <th className="px-2 py-2">Amount</th>
                                  <th className="px-2 py-2">Payment</th>
                                  <th className="px-2 py-2">Status</th>
                                  <th className="px-2 py-2">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredExpenses.map((e) => (
                                  <tr key={e.id} className="border-t border-ink/10">
                                    <td className="px-2 py-2.5 text-ink/60">{formatDate(e.expenseDate)}</td>
                                    <td className="px-2 py-2.5"><span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${colors[e.category]}22`, color: colors[e.category] }}>{e.category}</span></td>
                                    <td className="px-2 py-2.5 text-ink/80">
                                      {e.description}
                                      {(e.vendor || e.invoiceNumber) && (
                                        <p className="text-[10px] text-ink/35">{[e.vendor, e.invoiceNumber && `#${e.invoiceNumber}`].filter(Boolean).join(' · ')}</p>
                                      )}
                                    </td>
                                    <td className="px-2 py-2.5 font-semibold text-gold-300">{formatPrice(e.amount)}</td>
                                    <td className="px-2 py-2.5 text-ink/60 capitalize">{e.paymentMode.replace(/_/g, ' ')}</td>
                                    <td className="px-2 py-2.5">
                                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${e.status === 'paid' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>{e.status}</span>
                                    </td>
                                    <td className="px-2 py-2.5">
                                      <div className="flex items-center gap-2.5">
                                        {e.receiptUrl && (
                                          <a href={resolveFileUrl(e.receiptUrl)} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300">Receipt</a>
                                        )}
                                        <button onClick={() => openEditExpense(e)} className="text-xs text-ink/60 hover:text-ink">Edit</button>
                                        {isCustomer && (
                                          <button onClick={() => handleDeleteExpense(e.id)} disabled={deletingId === e.id} className="text-xs text-red-400/80 hover:text-red-400 disabled:opacity-50">
                                            {deletingId === e.id ? '...' : 'Delete'}
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {tab === 'planner' && (
                      <div>
                        {!isCustomer && (
                          <p className="mb-3 rounded-lg bg-ink/5 px-3 py-2 text-xs text-ink/50">Only the project owner can change budget allocations — you can still see how spending compares below.</p>
                        )}
                        <div className="max-w-xs">
                          <FormField id="totalBudget" label="Total project budget (₹)" type="number" value={plannerTotalBudget} onChange={(e) => setPlannerTotalBudget(e.target.value)} placeholder="e.g. 1500000" disabled={!isCustomer} />
                        </div>
                        <div className="mt-5 space-y-4">
                          {categoryNames.map((category) => {
                            const spent = overview.categories.find((c) => c.category === category)?.spentAmount || 0
                            const budgeted = Number(plannerAmounts[category]) || 0
                            const pct = budgeted > 0 ? Math.min(100, Math.round((spent / budgeted) * 100)) : 0
                            return (
                              <div key={category}>
                                <div className="flex items-center justify-between text-xs text-ink/60">
                                  <span className="flex items-center gap-1.5 font-medium text-ink/80">
                                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors[category] }} /> {category}
                                  </span>
                                  <span>{formatPrice(spent)} spent of {formatPrice(budgeted)}</span>
                                </div>
                                <div className="mt-1.5 flex items-center gap-3">
                                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? '#e34948' : colors[category] }} />
                                  </div>
                                  <input
                                    type="number"
                                    value={plannerAmounts[category] || ''}
                                    onChange={(e) => setPlannerAmounts((p) => ({ ...p, [category]: e.target.value }))}
                                    disabled={!isCustomer}
                                    className="w-28 shrink-0 rounded-lg border border-ink/15 bg-navy-950/40 px-2.5 py-1.5 text-xs text-ink outline-none disabled:opacity-50"
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {isCustomer && (
                          <button onClick={handleSavePlanner} disabled={savingPlanner} className="mt-5 flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-charcoal hover:bg-gold-400 disabled:opacity-60">
                            {savingPlanner && <Spinner className="h-4 w-4" />}
                            Save Budget
                          </button>
                        )}
                      </div>
                    )}

                    {tab === 'comparison' && (
                      <div className="flex flex-col items-center gap-3 py-6 text-center">
                        <p className="text-sm text-ink/70">Comparing supplier prices before you spend is the easiest way to stay under budget.</p>
                        <Link to="/dashboard/cost-comparison" className="rounded-full bg-gold-500 px-4 py-2 text-xs font-semibold text-charcoal hover:bg-gold-400">
                          Open Material Cost Comparison
                        </Link>
                      </div>
                    )}

                    {tab === 'reports' && (
                      !reportStats ? (
                        <p className="py-8 text-center text-sm text-ink/40">Add an expense to see a spending report.</p>
                      ) : (
                        <div className="space-y-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-ink">Budget vs Actual</p>
                            <div className="flex gap-2">
                              <button onClick={handleExportReportCsv} className="rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-medium text-ink/70 hover:border-ink/30">Export CSV</button>
                              <button onClick={handleExportReportPdf} className="rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-medium text-ink/70 hover:border-ink/30">Export PDF</button>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                              <thead className="text-xs uppercase tracking-wider text-ink/40">
                                <tr>
                                  <th className="px-2 py-2">Category</th>
                                  <th className="px-2 py-2">Budgeted</th>
                                  <th className="px-2 py-2">Spent</th>
                                  <th className="px-2 py-2">Remaining</th>
                                  <th className="px-2 py-2">Used</th>
                                </tr>
                              </thead>
                              <tbody>
                                {overview.categories.map((c) => {
                                  const remaining = c.budgetedAmount - c.spentAmount
                                  const pct = c.budgetedAmount > 0 ? Math.round((c.spentAmount / c.budgetedAmount) * 100) : null
                                  return (
                                    <tr key={c.category} className="border-t border-ink/10">
                                      <td className="px-2 py-2 text-ink/80">{c.category}</td>
                                      <td className="px-2 py-2 text-ink/60">{formatPrice(c.budgetedAmount)}</td>
                                      <td className="px-2 py-2 text-gold-300">{formatPrice(c.spentAmount)}</td>
                                      <td className={`px-2 py-2 ${remaining < 0 ? 'text-red-400' : 'text-emerald-300'}`}>{formatPrice(remaining)}</td>
                                      <td className="px-2 py-2 text-ink/60">{pct != null ? `${pct}%` : '—'}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {[
                              { label: 'Top Category', value: reportStats.topCategory ? `${reportStats.topCategory.category} (${formatPrice(reportStats.topCategory.spentAmount)})` : '—' },
                              { label: 'Budget Utilization', value: reportStats.utilization != null ? `${reportStats.utilization}%` : 'No budget set' },
                              { label: 'Average Expense', value: formatPrice(reportStats.avgAmount) },
                              { label: 'Paid Expenses', value: reportStats.paidCount },
                              { label: 'Pending Expenses', value: reportStats.pendingCount },
                              { label: 'Categories Over Budget', value: reportStats.overBudget.length },
                            ].map((r) => (
                              <div key={r.label} className="rounded-xl border border-ink/10 bg-navy-950/40 p-3.5">
                                <p className="text-[10px] font-medium uppercase tracking-wider text-ink/40">{r.label}</p>
                                <p className="mt-1.5 text-sm font-semibold text-ink">{r.value}</p>
                              </div>
                            ))}
                          </div>
                          {reportStats.overBudget.length > 0 && (
                            <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-3.5">
                              <p className="text-xs font-medium text-red-300">Over budget: {reportStats.overBudget.map((c) => c.category).join(', ')}</p>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </>
              )}
            </>
          )}

          <AnimatePresence>
            {showExpenseModal && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExpenseModal(false)} className="fixed inset-0 z-40 bg-black/70" />
                <motion.form
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  onSubmit={handleSubmitExpense}
                  className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-ink/10 bg-navy-900 p-5 shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-display text-sm font-semibold text-ink">{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</p>
                    <button type="button" onClick={() => setShowExpenseModal(false)} className="text-ink/40 hover:text-ink">✕</button>
                  </div>
                  {expenseError && <p className="mt-3 text-sm text-red-400">{expenseError}</p>}
                  <div className="mt-4 space-y-3.5">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink/60">Category</label>
                      <select
                        value={expenseForm.category}
                        onChange={(e) => setExpenseForm((p) => ({ ...p, category: e.target.value }))}
                        className="w-full rounded-lg border border-ink/15 bg-navy-900/60 px-4 py-2.5 text-sm text-ink outline-none"
                      >
                        {categoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField id="subcategory" label="Subcategory (optional)" value={expenseForm.subcategory} onChange={(e) => setExpenseForm((p) => ({ ...p, subcategory: e.target.value }))} placeholder="e.g. Cement & Concrete" />
                      <FormField id="material" label="Material (optional)" value={expenseForm.material} onChange={(e) => setExpenseForm((p) => ({ ...p, material: e.target.value }))} placeholder="e.g. UltraTech OPC 53" />
                    </div>
                    <FormField id="description" label="Description" value={expenseForm.description} onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))} placeholder="e.g. Cement — 50 bags" />
                    <FormField id="amount" label="Amount (₹)" type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))} placeholder="e.g. 21000" />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink/60">Payment Mode</label>
                        <select value={expenseForm.paymentMode} onChange={(e) => setExpenseForm((p) => ({ ...p, paymentMode: e.target.value }))} className="w-full rounded-lg border border-ink/15 bg-navy-900/60 px-3 py-2.5 text-sm text-ink outline-none capitalize">
                          {PAYMENT_MODES.map((m) => <option key={m} value={m} className="capitalize">{m.replace(/_/g, ' ')}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink/60">Status</label>
                        <select value={expenseForm.status} onChange={(e) => setExpenseForm((p) => ({ ...p, status: e.target.value }))} className="w-full rounded-lg border border-ink/15 bg-navy-900/60 px-3 py-2.5 text-sm text-ink outline-none">
                          <option value="paid">Paid</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>
                    </div>
                    <FormField id="expenseDate" label="Date" type="date" value={expenseForm.expenseDate} onChange={(e) => setExpenseForm((p) => ({ ...p, expenseDate: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField id="vendor" label="Vendor/Supplier (optional)" value={expenseForm.vendor} onChange={(e) => setExpenseForm((p) => ({ ...p, vendor: e.target.value }))} placeholder="e.g. Sri Venkateswara Traders" />
                      <FormField id="invoiceNumber" label="Invoice # (optional)" value={expenseForm.invoiceNumber} onChange={(e) => setExpenseForm((p) => ({ ...p, invoiceNumber: e.target.value }))} placeholder="e.g. INV-2026-041" />
                    </div>
                    <FormField id="notes" label="Notes (optional)" value={expenseForm.notes} onChange={(e) => setExpenseForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Anything else worth recording" />
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink/60">Receipt / Invoice (optional)</label>
                      {existingReceiptUrl && !receiptFile && (
                        <p className="mb-1.5 text-[11px] text-ink/40">Current: <a href={resolveFileUrl(existingReceiptUrl)} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">view file</a> (uploading a new one replaces it)</p>
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                        className="block w-full text-xs text-ink/60 file:mr-3 file:rounded-lg file:border-0 file:bg-gold-500/15 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-gold-300 hover:file:bg-gold-500/25"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={submitting} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-charcoal hover:bg-gold-400 disabled:opacity-60">
                    {submitting && <Spinner className="h-4 w-4" />}
                    {editingExpenseId ? 'Save Changes' : 'Save Expense'}
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

export default BudgetExpensesPage
