import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import {
  nearbySuppliersHandler, getSupplierHandler, supplierMaterialsHandler,
  registerSupplierHandler, getMySupplierHandler, updateMySupplierHandler, listMySupplierMaterialsHandler,
  listReviewsHandler, addReviewHandler,
  listPendingSuppliersHandler, verifySupplierHandler, disableSupplierHandler,
} from '../controllers/suppliersController.js'

const router = Router()

router.use(requireAuth)

router.get('/nearby', nearbySuppliersHandler)
router.post('/register', registerSupplierHandler)
router.get('/mine', getMySupplierHandler)
router.patch('/mine', updateMySupplierHandler)
router.get('/mine/materials', listMySupplierMaterialsHandler)

// Admin-only — this app has no self-serve admin signup (an operator promotes
// a user's role directly in the database), same pattern as budget categories.
router.get('/admin/pending', requireRole('admin'), listPendingSuppliersHandler)
router.patch('/:id/verify', requireRole('admin'), verifySupplierHandler)
router.patch('/:id/disable', requireRole('admin'), disableSupplierHandler)

router.get('/:id', getSupplierHandler)
router.get('/:id/materials', supplierMaterialsHandler)
router.get('/:id/reviews', listReviewsHandler)
router.post('/:id/reviews', requireRole('customer'), addReviewHandler)

export default router
