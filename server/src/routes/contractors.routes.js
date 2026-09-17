import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { listContractors } from '../controllers/contractorsController.js'

const router = Router()

router.use(requireAuth)
router.get('/', listContractors)

export default router
