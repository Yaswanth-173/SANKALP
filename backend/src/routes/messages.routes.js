import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  listContacts,
  createContact,
  deleteContact,
  listMessages,
  sendMessage,
} from '../controllers/messagesController.js'

const router = Router()

router.use(requireAuth)
router.get('/contacts', listContacts)
router.post('/contacts', createContact)
router.delete('/contacts/:id', deleteContact)
router.get('/contacts/:contactId/messages', listMessages)
router.post('/contacts/:contactId/messages', sendMessage)

export default router
