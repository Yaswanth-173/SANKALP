import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  addSupplierMaterialHandler, updateSupplierMaterialHandler, deleteSupplierMaterialHandler, addPriceHandler,
} from '../controllers/suppliersController.js'

const router = Router()

router.use(requireAuth)

router.post('/', addSupplierMaterialHandler)
router.patch('/:id', updateSupplierMaterialHandler)
router.delete('/:id', deleteSupplierMaterialHandler)
router.post('/:id/price', addPriceHandler)

export default router
