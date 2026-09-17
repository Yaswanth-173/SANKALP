import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { listEvents, createEvent, updateEvent, deleteEvent } from '../controllers/calendarController.js'

const router = Router()

router.use(requireAuth)
router.get('/events', listEvents)
router.post('/events', createEvent)
router.patch('/events/:id', updateEvent)
router.delete('/events/:id', deleteEvent)

export default router
