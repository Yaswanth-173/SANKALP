import { Router } from 'express'
import { createProject, listMyProjects, getProject, inviteSupervisor } from '../controllers/projectsController.js'
import { getProjectProgress, addProgressUpdate } from '../controllers/progressController.js'
import { getBudgetOverview, setBudgetCategories, listExpenses, createExpense, updateExpense, deleteExpense } from '../controllers/budgetController.js'
import { listProjectTasks } from '../controllers/tasksController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.post('/', requireRole('customer'), createProject)
router.get('/', requireRole('customer', 'supervisor'), listMyProjects)
router.get('/:id', requireRole('customer', 'supervisor'), getProject)
router.post('/:id/invite-supervisor', requireRole('customer'), inviteSupervisor)

router.get('/:id/progress', requireRole('customer', 'supervisor'), getProjectProgress)
router.post('/:id/progress-updates', requireRole('customer', 'supervisor'), addProgressUpdate)
router.get('/:id/tasks', requireRole('customer', 'supervisor'), listProjectTasks)

router.get('/:id/budget', requireRole('customer', 'supervisor'), getBudgetOverview)
router.put('/:id/budget', requireRole('customer'), setBudgetCategories)
router.get('/:id/expenses', requireRole('customer', 'supervisor'), listExpenses)
router.post('/:id/expenses', requireRole('customer', 'supervisor'), createExpense)
router.put('/:id/expenses/:expenseId', requireRole('customer', 'supervisor'), updateExpense)
router.delete('/:id/expenses/:expenseId', requireRole('customer'), deleteExpense)

export default router
