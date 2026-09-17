import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { listNotes, createNote, updateNote, deleteNote } from '../controllers/notesController.js'

const router = Router()

router.use(requireAuth)
router.get('/', listNotes)
router.post('/', createNote)
router.patch('/:id', updateNote)
router.delete('/:id', deleteNote)

export default router
