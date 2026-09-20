import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { correctPriceHandler } from '../controllers/suppliersController.js'

const router = Router()

router.use(requireAuth)
router.patch('/:id', correctPriceHandler)

export default router
