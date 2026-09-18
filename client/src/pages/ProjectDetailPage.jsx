import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import Spinner from '../components/Spinner.jsx'
import FormField from '../components/FormField.jsx'
import { BackArrowIcon } from '../components/dashboard/icons.jsx'
import { apiFetch } from '../utils/api.js'

const inviteInitial = { fullName: '', email: '', phone: '' }

function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [invite, setInvite] = useState(inviteInitial)
  const [inviteErrors, setInviteErrors] = useState({})
  const [inviteStatus, setInviteStatus] = useState('idle') // idle | submitting | success
  const [inviteMessage, setInviteMessage] = useState('')

  const loadProject = async () => {
    try {
      const data = await apiFetch(`/api/projects/${id}`)
      setProject(data.project)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleInvite = async (e) => {
    e.preventDefault()
    if (inviteStatus === 'submitting') return
    setInviteStatus('submitting')
    setInviteErrors({})
    setInviteMessage('')
    try {
      await apiFetch(`/api/projects/${id}/invite-supervisor`, { method: 'POST', body: JSON.stringify(invite) })
      setInviteMessage('Supervisor added — they will receive an email with sign-in details.')
      setInviteStatus('success')
      setInvite(inviteInitial)
      await loadProject()
      setTimeout(() => setShowInvite(false), 1600)
    } catch (err) {
      if (err.errors) setInviteErrors(err.errors)
      setInviteMessage(err.message)
      setInviteStatus('idle')
    }
  }

  if (loading) {
    return (
      <DashboardShell>
        {({ onMenuClick }) => (
          <>
            <DashboardHeader onMenuClick={onMenuClick} title="Project" subtitle="Loading…" />
            <div className="mt-16 flex justify-center">
              <Spinner className="h-6 w-6 text-ink/40" />
            </div>
          </>
        )}
      </DashboardShell>
    )
  }

  if (error || !project) {
    return (
      <DashboardShell>
        {({ onMenuClick }) => (
          <>
            <DashboardHeader onMenuClick={onMenuClick} title="Project" subtitle="" />
            <p className="mt-5 text-sm text-red-400">{error || 'Project not found'}</p>
          </>
        )}
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader onMenuClick={onMenuClick} title={project.name} subtitle={project.location || 'No location set'} />

          <button
            onClick={() => navigate('/dashboard/projects')}
            className="mt-4 flex items-center gap-1.5 text-xs font-medium text-ink/50 hover:text-ink"
          >
            <BackArrowIcon className="h-3.5 w-3.5" /> All projects
          </button>

          <div className="mt-6 rounded-2xl border border-ink/10 bg-navy-900/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-sm font-semibold text-ink">Supervisors</p>
                <p className="text-xs text-ink/45">People overseeing day-to-day work on this project.</p>
              </div>
              <button
                onClick={() => setShowInvite((v) => !v)}
                className="rounded-full border border-gold-500/40 px-3.5 py-1.5 text-xs font-semibold text-gold-300 hover:bg-gold-500/10"
              >
                {showInvite ? 'Cancel' : '+ Invite Supervisor'}
              </button>
            </div>

            <AnimatePresence>
              {showInvite && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleInvite}
                  className="mt-4 overflow-hidden border-t border-ink/10 pt-4"
                >
                  {inviteMessage && (
                    <p className={`mb-3 text-sm ${inviteStatus === 'success' ? 'text-emerald-300' : 'text-red-400'}`}>{inviteMessage}</p>
                  )}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      id="fullName"
                      label="Full name"
                      value={invite.fullName}
                      onChange={(e) => setInvite((p) => ({ ...p, fullName: e.target.value }))}
                      error={inviteErrors.fullName}
                      placeholder="Supervisor's name"
                    />
                    <FormField
                      id="email"
                      label="Email"
                      type="email"
                      value={invite.email}
                      onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))}
                      error={inviteErrors.email}
                      placeholder="supervisor@example.com"
                    />
                    <FormField
                      id="phone"
                      label="Phone"
                      value={invite.phone}
                      onChange={(e) => setInvite((p) => ({ ...p, phone: e.target.value }))}
                      error={inviteErrors.phone}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={inviteStatus === 'submitting'}
                    className="mt-4 flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-charcoal hover:bg-gold-400 disabled:opacity-60"
                  >
                    {inviteStatus === 'submitting' && <Spinner className="h-4 w-4" />}
                    Send Invite
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-4 space-y-2">
              {project.members?.length === 0 || !project.members ? (
                <p className="text-sm text-ink/40">No supervisors added yet.</p>
              ) : (
                project.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border border-ink/10 bg-navy-950/40 px-4 py-2.5">
                    <div>
                      <p className="text-sm text-ink/90">{m.fullName}</p>
                      <p className="text-xs text-ink/40">{m.email}</p>
                    </div>
                    <span className="rounded-full bg-gold-500/10 px-2.5 py-1 text-[10px] font-medium capitalize text-gold-300">
                      {m.roleOnProject}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  )
}

export default ProjectDetailPage
