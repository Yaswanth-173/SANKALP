import { query } from '../config/db.js'
import { canAccessProject } from './projectsController.js'

// Shared by budget planning and expense tracking so the "budget vs spent"
// chart and the planner bars always describe the same set of buckets.
export const BUDGET_CATEGORIES = ['Foundation', 'Structure', 'Electrical', 'Plumbing', 'Finishing', 'Others']

const PAYMENT_MODES = ['cash', 'upi', 'card', 'bank_transfer']

const publicExpense = (e) => ({
  id: e.id,
  category: e.category,
  description: e.description,
  amount: Number(e.amount),
  paymentMode: e.payment_mode,
  status: e.status,
  expenseDate: e.expense_date,
  vendor: e.vendor,
  invoiceNumber: e.invoice_number,
  notes: e.notes,
  receiptUrl: e.receipt_url,
  createdAt: e.created_at,
})

export async function getBudgetOverview(req, res) {
  const { id: projectId } = req.params
  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    const { rows: projectRows } = await query('SELECT total_budget FROM projects WHERE id = $1', [projectId])
    if (!projectRows.length) return res.status(404).json({ message: 'Project not found' })
    const totalBudget = projectRows[0].total_budget != null ? Number(projectRows[0].total_budget) : 0

    const { rows: budgetRows } = await query('SELECT category, budgeted_amount FROM budget_categories WHERE project_id = $1', [projectId])
    const budgetByCategory = new Map(budgetRows.map((r) => [r.category, Number(r.budgeted_amount)]))

    const { rows: spentRows } = await query(
      `SELECT category, COALESCE(SUM(amount), 0)::numeric AS spent, count(*)::int AS count
       FROM expenses WHERE project_id = $1 GROUP BY category`,
      [projectId]
    )
    const spentByCategory = new Map(spentRows.map((r) => [r.category, Number(r.spent)]))
    const totalExpenseCount = spentRows.reduce((sum, r) => sum + r.count, 0)

    const categories = BUDGET_CATEGORIES.map((category) => ({
      category,
      budgetedAmount: budgetByCategory.get(category) || 0,
      spentAmount: spentByCategory.get(category) || 0,
    }))

    const totalSpent = categories.reduce((sum, c) => sum + c.spentAmount, 0)

    const { rows: recentExpenses } = await query(
      `SELECT * FROM expenses WHERE project_id = $1 ORDER BY expense_date DESC, created_at DESC LIMIT 10`,
      [projectId]
    )

    res.json({
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
      totalExpenseCount,
      categories,
      recentExpenses: recentExpenses.map(publicExpense),
    })
  } catch (err) {
    console.error('Get budget overview error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function setBudgetCategories(req, res) {
  const { id: projectId } = req.params
  const { categories, totalBudget } = req.body ?? {}

  if (!Array.isArray(categories)) return res.status(400).json({ message: 'categories must be an array' })
  for (const c of categories) {
    if (!BUDGET_CATEGORIES.includes(c.category)) return res.status(400).json({ message: `Unknown category: ${c.category}` })
    if (typeof c.budgetedAmount !== 'number' || c.budgetedAmount < 0) return res.status(400).json({ message: 'Each budgetedAmount must be a non-negative number' })
  }

  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    for (const c of categories) {
      await query(
        `INSERT INTO budget_categories (project_id, category, budgeted_amount)
         VALUES ($1, $2, $3)
         ON CONFLICT (project_id, category) DO UPDATE SET budgeted_amount = $3, updated_at = now()`,
        [projectId, c.category, c.budgetedAmount]
      )
    }
    if (totalBudget != null) {
      await query('UPDATE projects SET total_budget = $1, updated_at = now() WHERE id = $2', [Number(totalBudget), projectId])
    }

    res.json({ message: 'Budget updated' })
  } catch (err) {
    console.error('Set budget categories error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function listExpenses(req, res) {
  const { id: projectId } = req.params
  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    const { rows } = await query('SELECT * FROM expenses WHERE project_id = $1 ORDER BY expense_date DESC, created_at DESC', [projectId])
    res.json({ expenses: rows.map(publicExpense) })
  } catch (err) {
    console.error('List expenses error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

function validateExpenseInput({ category, description, amount, paymentMode }) {
  const errors = {}
  if (!BUDGET_CATEGORIES.includes(category)) errors.category = 'Choose a valid category'
  if (!description || description.trim().length < 2) errors.description = 'Enter a description'
  const amountNum = Number(amount)
  if (!Number.isFinite(amountNum) || amountNum < 0) errors.amount = 'Enter a valid amount'
  if (paymentMode && !PAYMENT_MODES.includes(paymentMode)) errors.paymentMode = 'Invalid payment mode'
  return { errors, amountNum }
}

export async function createExpense(req, res) {
  const { id: projectId } = req.params
  const { category, description, amount, paymentMode, status, expenseDate, vendor, invoiceNumber, notes, receiptUrl } = req.body ?? {}

  const { errors, amountNum } = validateExpenseInput({ category, description, amount, paymentMode })
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Please fix the highlighted fields', errors })

  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    const { rows } = await query(
      `INSERT INTO expenses (project_id, created_by, category, description, amount, payment_mode, status, expense_date, vendor, invoice_number, notes, receipt_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, CURRENT_DATE), $9, $10, $11, $12) RETURNING *`,
      [
        projectId, req.user.id, category, description.trim(), amountNum, paymentMode || 'cash',
        status === 'pending' ? 'pending' : 'paid', expenseDate || null,
        vendor?.trim() || null, invoiceNumber?.trim() || null, notes?.trim() || null, receiptUrl || null,
      ]
    )
    res.status(201).json({ expense: publicExpense(rows[0]) })
  } catch (err) {
    console.error('Create expense error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function updateExpense(req, res) {
  const { id: projectId, expenseId } = req.params
  const { category, description, amount, paymentMode, status, expenseDate, vendor, invoiceNumber, notes, receiptUrl } = req.body ?? {}

  const { errors, amountNum } = validateExpenseInput({ category, description, amount, paymentMode })
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Please fix the highlighted fields', errors })

  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    const { rows } = await query(
      `UPDATE expenses SET category = $1, description = $2, amount = $3, payment_mode = $4, status = $5,
         expense_date = COALESCE($6, expense_date), vendor = $7, invoice_number = $8, notes = $9,
         receipt_url = COALESCE($10, receipt_url)
       WHERE id = $11 AND project_id = $12 RETURNING *`,
      [
        category, description.trim(), amountNum, paymentMode || 'cash', status === 'pending' ? 'pending' : 'paid',
        expenseDate || null, vendor?.trim() || null, invoiceNumber?.trim() || null, notes?.trim() || null,
        receiptUrl || null, expenseId, projectId,
      ]
    )
    if (!rows.length) return res.status(404).json({ message: 'Expense not found' })
    res.json({ expense: publicExpense(rows[0]) })
  } catch (err) {
    console.error('Update expense error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function deleteExpense(req, res) {
  const { id: projectId, expenseId } = req.params
  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    const { rowCount } = await query('DELETE FROM expenses WHERE id = $1 AND project_id = $2', [expenseId, projectId])
    if (!rowCount) return res.status(404).json({ message: 'Expense not found' })
    res.json({ message: 'Expense deleted' })
  } catch (err) {
    console.error('Delete expense error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}
