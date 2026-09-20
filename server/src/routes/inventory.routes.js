import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { updateInventoryHandler } from '../controllers/suppliersController.js'

const router = Router()

router.use(requireAuth)
router.patch('/:id', updateInventoryHandler)

export default router
