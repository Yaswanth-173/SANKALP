import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import Spinner from '../components/Spinner.jsx'
import FormField from '../components/FormField.jsx'
import { ProjectsIcon } from '../components/dashboard/icons.jsx'
import { apiFetch } from '../utils/api.js'
import { uploadImages, resolveFileUrl } from '../utils/upload.js'
import { setSelectedProjectId } from '../utils/selectedProject.js'

const formInitial = { name: '', projectType: 'Residential', description: '', location: '', address: '', startDate: '', expectedCompletion: '', totalBudget: '' }
const PROJECT_TYPES = ['Residential', 'Commercial', 'Renovation', 'Other']

function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(formInitial)
  const [imageFile, setImageFile] = useState(null)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

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
      let project = data.project
      if (!project) throw new Error('The project could not be created. Please try again.')

      if (imageFile) {
        try {
          const [imageUrl] = await uploadImages(project.id, [imageFile])
          const updated = await apiFetch(`/api/projects/${project.id}`, { method: 'PUT', body: JSON.stringify({ imageUrl }) })
          project = updated.project || project
        } catch {
          // Non-fatal — the project itself was created fine; the cover image can be added later.
        }
      }

      setProjects((prev) => [project, ...prev])
      setForm(formInitial)
      setImageFile(null)
      setShowForm(false)
      setSelectedProjectId(project.id)
      setToast('Project created!')
      setTimeout(() => navigate(`/dashboard/projects/${project.id}`), 900)
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
                  <div>
                    <label htmlFor="projectType" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink/60">Project type</label>
                    <select
                      id="projectType"
                      value={form.projectType}
                      onChange={(e) => setForm((p) => ({ ...p, projectType: e.target.value }))}
                      className="w-full rounded-lg border border-ink/15 bg-navy-900/60 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold-500/70"
                    >
                      {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <FormField
                    id="location"
                    label="Location (optional)"
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. Hyderabad"
                  />
                  <FormField
                    id="address"
                    label="Property address (optional)"
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="e.g. Plot 12, Kondapur Main Road"
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
                    label="Estimated budget in ₹ (optional)"
                    type="number"
                    value={form.totalBudget}
                    onChange={(e) => setForm((p) => ({ ...p, totalBudget: e.target.value }))}
                    placeholder="e.g. 1500000"
                  />
                  <div>
                    <label htmlFor="projectImage" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink/60">Project image (optional)</label>
                    <input
                      id="projectImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="w-full rounded-lg border border-ink/15 bg-navy-900/60 px-3 py-2 text-xs text-ink/70 outline-none file:mr-3 file:rounded-md file:border-0 file:bg-gold-500/15 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-gold-300"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label htmlFor="description" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink/60">Description (optional)</label>
                    <textarea
                      id="description"
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="What's this project about?"
                      className="w-full rounded-lg border border-ink/15 bg-navy-900/60 px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold-500/70"
                    />
                  </div>
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
                  className="rounded-2xl border border-ink/10 bg-navy-900/50 p-5 transition-colors duration-200 hover:border-gold-500/30"
                >
                  <Link to={`/dashboard/projects/${project.id}`} className="block">
                    {project.imageUrl ? (
                      <img src={resolveFileUrl(project.imageUrl)} alt="" className="mb-3 h-28 w-full rounded-xl object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10 text-gold-300">
                        <ProjectsIcon className="h-5 w-5" />
                      </span>
                    )}
                    <p className="mt-3 font-display text-sm font-semibold text-ink">{project.name}</p>
                    <p className="mt-1 text-xs text-ink/45">{project.projectType ? `${project.projectType} · ` : ''}{project.location || 'No location set'}</p>
                    <span className="mt-3 inline-block rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium capitalize text-emerald-300">
                      {project.status}
                    </span>
                  </Link>
                  <div className="mt-3 flex items-center gap-2 border-t border-ink/10 pt-3">
                    <Link
                      to="/dashboard/progress"
                      onClick={() => setSelectedProjectId(project.id)}
                      className="rounded-full border border-ink/15 px-2.5 py-1 text-[10px] font-medium text-ink/60 hover:bg-ink/5"
                    >
                      Progress Updates
                    </Link>
                    <Link
                      to="/dashboard/budget"
                      onClick={() => setSelectedProjectId(project.id)}
                      className="rounded-full border border-ink/15 px-2.5 py-1 text-[10px] font-medium text-ink/60 hover:bg-ink/5"
                    >
                      Budget & Expenses
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="fixed bottom-6 right-6 rounded-xl border border-emerald-400/30 bg-navy-900 px-4 py-3 text-sm text-emerald-300 shadow-xl"
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

export default ProjectsPage
