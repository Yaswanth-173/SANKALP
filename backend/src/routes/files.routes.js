import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getFile } from '../controllers/filesController.js'

const router = Router()

router.use(requireAuth)
router.get('/:fileId', getFile)

export default router
