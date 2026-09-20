import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import {
  listCategoriesHandler, listMaterialsHandler, getMaterialHandler, materialSuppliersHandler,
  searchMaterialsHandler, listOrdersHandler, createOrderHandler,
} from '../controllers/materialsController.js'

const router = Router()

router.use(requireAuth)

router.get('/categories', listCategoriesHandler)
router.get('/search', searchMaterialsHandler)
router.get('/orders', requireRole('customer'), listOrdersHandler)
router.post('/orders', requireRole('customer'), createOrderHandler)
router.get('/:id/suppliers', materialSuppliersHandler)
router.get('/:id', getMaterialHandler)
router.get('/', listMaterialsHandler)

export default router
