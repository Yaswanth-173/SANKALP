import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import Spinner from '../components/Spinner.jsx'
import FormField from '../components/FormField.jsx'
import { ProjectsIcon } from '../components/dashboard/icons.jsx'
import { apiFetch } from '../utils/api.js'

function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', location: '', startDate: '', expectedCompletion: '', totalBudget: '' })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  const handleCreate = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!form.name.trim()) {
      setFormError('Give the project a name')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      const data = await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          totalBudget: form.totalBudget ? Number(form.totalBudget) : undefined,
        }),
      })
      setProjects((prev) => [data.project, ...prev])
      setForm({ name: '', location: '', startDate: '', expectedCompletion: '', totalBudget: '' })
      setShowForm(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardShell>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader
            onMenuClick={onMenuClick}
            title="Projects"
            subtitle="Create a project and invite a supervisor to help run it day-to-day."
          />

          <div className="mt-5 flex justify-end">
            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-full bg-gold-500 px-4 py-2 text-xs font-semibold text-charcoal hover:bg-gold-400"
            >
              {showForm ? 'Cancel' : '+ New Project'}
            </button>
          </div>

          <AnimatePresence>
            {showForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreate}
                className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-navy-900/50 p-5"
              >
                {formError && <p className="mb-3 text-sm text-red-400">{formError}</p>}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FormField
                    id="name"
                    label="Project name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. New Home at Kondapur"
                  />
                  <FormField
                    id="location"
                    label="Location (optional)"
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. Hyderabad"
                  />
                  <FormField
                    id="startDate"
                    label="Start date (optional)"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  />
                  <FormField
                    id="expectedCompletion"
                    label="Expected completion (optional)"
                    type="date"
                    value={form.expectedCompletion}
                    onChange={(e) => setForm((p) => ({ ...p, expectedCompletion: e.target.value }))}
                  />
                  <FormField
                    id="totalBudget"
                    label="Total budget in ₹ (optional)"
                    type="number"
                    value={form.totalBudget}
                    onChange={(e) => setForm((p) => ({ ...p, totalBudget: e.target.value }))}
                    placeholder="e.g. 1500000"
                  />
                </div>
                <p className="mt-3 text-[11px] text-ink/35">Adding dates and a budget unlocks the Timeline and Budget Planner views for this project.</p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-charcoal hover:bg-gold-400 disabled:opacity-60"
                >
                  {submitting && <Spinner className="h-4 w-4" />}
                  Create Project
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {error && <p className="mt-5 text-sm text-red-400">{error}</p>}

          {loading ? (
            <div className="mt-16 flex justify-center">
              <Spinner className="h-6 w-6 text-ink/40" />
            </div>
          ) : projects.length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-3 text-center text-ink/40">
              <ProjectsIcon className="h-10 w-10" />
              <p className="text-sm">No projects yet. Create one to invite a supervisor onto it.</p>
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
                    to={`/dashboard/projects/${project.id}`}
                    className="block rounded-2xl border border-ink/10 bg-navy-900/50 p-5 transition-colors duration-200 hover:border-gold-500/30"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10 text-gold-300">
                      <ProjectsIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 font-display text-sm font-semibold text-ink">{project.name}</p>
                    <p className="mt-1 text-xs text-ink/45">{project.location || 'No location set'}</p>
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

export default ProjectsPage
