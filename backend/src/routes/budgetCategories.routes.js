import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import {
  listBudgetCategoriesHandler,
  createBudgetCategoryHandler,
  updateBudgetCategoryHandler,
  toggleBudgetCategoryActiveHandler,
  reorderBudgetCategoriesHandler,
} from '../controllers/budgetController.js'

const router = Router()

router.use(requireAuth)

// Read is open to any authenticated project role — expense/budget forms
// need the active list. Writes are admin-only: this app has no self-serve
// admin signup (an operator promotes a user's role directly in the
// database), which is deliberate — global category definitions shouldn't
// be editable by an ordinary customer or supervisor.
router.get('/', listBudgetCategoriesHandler)
router.post('/', requireRole('admin'), createBudgetCategoryHandler)
router.patch('/reorder', requireRole('admin'), reorderBudgetCategoriesHandler)
router.put('/:id', requireRole('admin'), updateBudgetCategoryHandler)
router.patch('/:id/active', requireRole('admin'), toggleBudgetCategoryActiveHandler)

export default router
