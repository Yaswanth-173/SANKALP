import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { listShops, listOrders, createOrder } from '../controllers/materialsController.js'

const router = Router()

router.use(requireAuth)
router.get('/shops', listShops)
router.get('/orders', listOrders)
router.post('/orders', createOrder)

export default router
