import { Router } from 'express'
import { createProject, listMyProjects, getProject, inviteSupervisor } from '../controllers/projectsController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.post('/', requireRole('customer'), createProject)
router.get('/', requireRole('customer', 'supervisor'), listMyProjects)
router.get('/:id', requireRole('customer', 'supervisor'), getProject)
router.post('/:id/invite-supervisor', requireRole('customer'), inviteSupervisor)

export default router
