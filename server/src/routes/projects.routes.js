import { Router } from 'express'
import { createProject, listMyProjects, getProject, updateProject, inviteSupervisor } from '../controllers/projectsController.js'
import { getProjectProgress, addProgressUpdate, editProgressUpdate, deleteProgressUpdate } from '../controllers/progressController.js'
import { getBudgetOverview, setBudgetCategories, listExpenses, createExpense, updateExpense, deleteExpense } from '../controllers/budgetController.js'
import { listProjectTasks, assignTask, updateProjectTaskProgress, deleteProjectTask } from '../controllers/tasksController.js'
import { listProjectContractors, assignContractorToProject } from '../controllers/contractorsController.js'
import { uploadProjectImages, uploadProjectDocument } from '../controllers/filesController.js'
import { uploadImages, uploadDocument, handleMulterError } from '../middleware/upload.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

// A project's own file uploads (site photos, receipts) — kept project-scoped
// so canAccessProject gates who can even attempt an upload, before the file
// ever touches disk or gets a project_files row.
const withImages = (req, res, next) => uploadImages.array('files', 6)(req, res, (err) => handleMulterError(err, req, res, next))
const withDocument = (req, res, next) => uploadDocument.single('file')(req, res, (err) => handleMulterError(err, req, res, next))

router.post('/', requireRole('customer'), createProject)
router.get('/', requireRole('customer', 'supervisor', 'contractor'), listMyProjects)
router.get('/:id', requireRole('customer', 'supervisor', 'contractor'), getProject)
router.put('/:id', requireRole('customer'), updateProject)
router.post('/:id/invite-supervisor', requireRole('customer'), inviteSupervisor)

router.get('/:id/contractors', requireRole('customer', 'supervisor', 'contractor'), listProjectContractors)
router.post('/:id/contractors', requireRole('customer'), assignContractorToProject)

router.get('/:id/progress', requireRole('customer', 'supervisor', 'contractor'), getProjectProgress)
router.post('/:id/progress-updates', requireRole('customer', 'supervisor', 'contractor'), addProgressUpdate)
router.put('/:id/progress-updates/:updateId', requireRole('customer', 'supervisor'), editProgressUpdate)
router.delete('/:id/progress-updates/:updateId', requireRole('customer', 'supervisor'), deleteProgressUpdate)

router.get('/:id/tasks', requireRole('customer', 'supervisor', 'contractor'), listProjectTasks)
router.put('/:id/tasks/:taskId/assign', requireRole('customer', 'supervisor'), assignTask)
router.patch('/:id/tasks/:taskId/progress', requireRole('customer', 'supervisor', 'contractor'), updateProjectTaskProgress)
router.delete('/:id/tasks/:taskId', requireRole('customer', 'supervisor'), deleteProjectTask)

router.get('/:id/budget', requireRole('customer', 'supervisor'), getBudgetOverview)
router.put('/:id/budget', requireRole('customer'), setBudgetCategories)
router.get('/:id/expenses', requireRole('customer', 'supervisor'), listExpenses)
router.post('/:id/expenses', requireRole('customer', 'supervisor'), createExpense)
router.put('/:id/expenses/:expenseId', requireRole('customer', 'supervisor'), updateExpense)
router.delete('/:id/expenses/:expenseId', requireRole('customer'), deleteExpense)

router.post('/:id/files/images', requireRole('customer', 'supervisor', 'contractor'), withImages, uploadProjectImages)
router.post('/:id/files/document', requireRole('customer', 'supervisor', 'contractor'), withDocument, uploadProjectDocument)

export default router
