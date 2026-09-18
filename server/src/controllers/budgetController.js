import { query, withTransaction } from '../config/db.js'
import { canAccessProject } from './projectsController.js'

const PAYMENT_MODES = ['cash', 'upi', 'card', 'bank_transfer']

const publicCategoryDef = (c) => ({
  id: c.id,
  name: c.name,
  description: c.description,
  parentCategoryId: c.parent_category_id,
  isActive: c.is_active,
  sortOrder: c.sort_order,
  createdAt: c.created_at,
  updatedAt: c.updated_at,
})

// The active, ordered master list — this is what expense/budget forms show
// and what new expenses/allocations are validated against. Admin-managed via
// the /api/budget-categories CRUD endpoints below (see budgetCategories.routes.js).
async function getActiveCategoryNames() {
  const { rows } = await query('SELECT name FROM budget_category_defs WHERE is_active = true ORDER BY sort_order, name')
  return rows.map((r) => r.name)
}

export async function listBudgetCategoriesHandler(req, res) {
  try {
    const includeInactive = req.query.all === 'true' && req.user.role === 'admin'
    const { rows } = await query(
      `SELECT * FROM budget_category_defs ${includeInactive ? '' : 'WHERE is_active = true'} ORDER BY sort_order, name`
    )
    res.json({ categories: rows.map(publicCategoryDef) })
  } catch (err) {
    console.error('List budget categories error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function createBudgetCategoryHandler(req, res) {
  const { name, description, parentCategoryId } = req.body ?? {}
  if (!name || !name.trim()) return res.status(400).json({ message: 'Enter a category name' })

  try {
    const { rows: maxRows } = await query('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM budget_category_defs')
    const { rows } = await query(
      `INSERT INTO budget_category_defs (name, description, parent_category_id, sort_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), description?.trim() || null, parentCategoryId || null, maxRows[0].next]
    )
    res.status(201).json({ category: publicCategoryDef(rows[0]) })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'A category with this name already exists' })
    console.error('Create budget category error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function updateBudgetCategoryHandler(req, res) {
  const { id } = req.params
  const { name, description, parentCategoryId } = req.body ?? {}
  if (!name || !name.trim()) return res.status(400).json({ message: 'Enter a category name' })

  try {
    const { rows } = await query(
      `UPDATE budget_category_defs SET name = $1, description = $2, parent_category_id = $3, updated_at = now()
       WHERE id = $4 RETURNING *`,
      [name.trim(), description?.trim() || null, parentCategoryId || null, id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Category not found' })
    res.json({ category: publicCategoryDef(rows[0]) })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'A category with this name already exists' })
    console.error('Update budget category error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function toggleBudgetCategoryActiveHandler(req, res) {
  const { id } = req.params
  const { isActive } = req.body ?? {}
  try {
    const { rows } = await query(
      `UPDATE budget_category_defs SET is_active = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [!!isActive, id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Category not found' })
    res.json({ category: publicCategoryDef(rows[0]) })
  } catch (err) {
    console.error('Toggle budget category error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function reorderBudgetCategoriesHandler(req, res) {
  const { orderedIds } = req.body ?? {}
  if (!Array.isArray(orderedIds) || !orderedIds.length) {
    return res.status(400).json({ message: 'orderedIds must be a non-empty array' })
  }
  try {
    await withTransaction(async (client) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query('UPDATE budget_category_defs SET sort_order = $1, updated_at = now() WHERE id = $2', [i, orderedIds[i]])
      }
    })
    const { rows } = await query('SELECT * FROM budget_category_defs ORDER BY sort_order, name')
    res.json({ categories: rows.map(publicCategoryDef) })
  } catch (err) {
    console.error('Reorder budget categories error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

const publicExpense = (e) => ({
  id: e.id,
  category: e.category,
  description: e.description,
  amount: Number(e.amount),
  paymentMode: e.payment_mode,
  status: e.status,
  expenseDate: e.expense_date,
  subcategory: e.subcategory,
  material: e.material,
  vendor: e.vendor,
  invoiceNumber: e.invoice_number,
  notes: e.notes,
  receiptUrl: e.receipt_url,
  createdAt: e.created_at,
  updatedAt: e.updated_at,
})

export async function getBudgetOverview(req, res) {
  const { id: projectId } = req.params
  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    const { rows: projectRows } = await query('SELECT total_budget FROM projects WHERE id = $1', [projectId])
    if (!projectRows.length) return res.status(404).json({ message: 'Project not found' })
    const totalBudget = projectRows[0].total_budget != null ? Number(projectRows[0].total_budget) : 0

    const { rows: defRows } = await query('SELECT name, sort_order, is_active FROM budget_category_defs ORDER BY sort_order, name')

    const { rows: budgetRows } = await query('SELECT category, budgeted_amount FROM budget_categories WHERE project_id = $1', [projectId])
    const budgetByCategory = new Map(budgetRows.map((r) => [r.category, Number(r.budgeted_amount)]))

    const { rows: spentRows } = await query(
      `SELECT category, COALESCE(SUM(amount), 0)::numeric AS spent, count(*)::int AS count
       FROM expenses WHERE project_id = $1 GROUP BY category`,
      [projectId]
    )
    const spentByCategory = new Map(spentRows.map((r) => [r.category, Number(r.spent)]))
    const totalExpenseCount = spentRows.reduce((sum, r) => sum + r.count, 0)

    // Active categories drive the list first (in admin-defined order); any
    // category name that was disabled after it already had budget/expense
    // data stays visible too, so disabling a category never silently hides
    // real spend from the totals or charts.
    const definedNames = defRows.map((d) => d.name)
    const activeNames = defRows.filter((d) => d.is_active).map((d) => d.name)
    const nameSet = new Set(activeNames)
    for (const name of budgetByCategory.keys()) nameSet.add(name)
    for (const name of spentByCategory.keys()) nameSet.add(name)
    const extraNames = [...nameSet].filter((n) => !definedNames.includes(n)).sort()
    const categoryNames = [...definedNames.filter((n) => nameSet.has(n)), ...extraNames]

    const categories = categoryNames.map((category) => ({
      category,
      budgetedAmount: budgetByCategory.get(category) || 0,
      spentAmount: spentByCategory.get(category) || 0,
    }))

    const totalSpent = [...spentByCategory.values()].reduce((sum, v) => sum + v, 0)

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

  try {
    const validCategories = await getActiveCategoryNames()
    for (const c of categories) {
      if (!validCategories.includes(c.category)) return res.status(400).json({ message: `Unknown category: ${c.category}` })
      if (typeof c.budgetedAmount !== 'number' || c.budgetedAmount < 0) return res.status(400).json({ message: 'Each budgetedAmount must be a non-negative number' })
    }

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

function validateExpenseInput({ category, description, amount, paymentMode }, validCategories) {
  const errors = {}
  if (!validCategories.includes(category)) errors.category = 'Choose a valid category'
  if (!description || description.trim().length < 2) errors.description = 'Enter a description'
  const amountNum = Number(amount)
  if (!Number.isFinite(amountNum) || amountNum < 0) errors.amount = 'Enter a valid amount'
  if (paymentMode && !PAYMENT_MODES.includes(paymentMode)) errors.paymentMode = 'Invalid payment mode'
  return { errors, amountNum }
}

export async function createExpense(req, res) {
  const { id: projectId } = req.params
  const { category, description, amount, paymentMode, status, expenseDate, vendor, invoiceNumber, notes, receiptUrl, subcategory, material } = req.body ?? {}

  try {
    const validCategories = await getActiveCategoryNames()
    const { errors, amountNum } = validateExpenseInput({ category, description, amount, paymentMode }, validCategories)
    if (Object.keys(errors).length) return res.status(400).json({ message: 'Please fix the highlighted fields', errors })

    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    const { rows } = await query(
      `INSERT INTO expenses (project_id, created_by, category, description, amount, payment_mode, status, expense_date, vendor, invoice_number, notes, receipt_url, subcategory, material)
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, CURRENT_DATE), $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        projectId, req.user.id, category, description.trim(), amountNum, paymentMode || 'cash',
        status === 'pending' ? 'pending' : 'paid', expenseDate || null,
        vendor?.trim() || null, invoiceNumber?.trim() || null, notes?.trim() || null, receiptUrl || null,
        subcategory?.trim() || null, material?.trim() || null,
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
  const { category, description, amount, paymentMode, status, expenseDate, vendor, invoiceNumber, notes, receiptUrl, subcategory, material } = req.body ?? {}

  try {
    const validCategories = await getActiveCategoryNames()
    const { errors, amountNum } = validateExpenseInput({ category, description, amount, paymentMode }, validCategories)
    if (Object.keys(errors).length) return res.status(400).json({ message: 'Please fix the highlighted fields', errors })

    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    const { rows } = await query(
      `UPDATE expenses SET category = $1, description = $2, amount = $3, payment_mode = $4, status = $5,
         expense_date = COALESCE($6, expense_date), vendor = $7, invoice_number = $8, notes = $9,
         receipt_url = COALESCE($10, receipt_url), subcategory = $13, material = $14, updated_at = now()
       WHERE id = $11 AND project_id = $12 RETURNING *`,
      [
        category, description.trim(), amountNum, paymentMode || 'cash', status === 'pending' ? 'pending' : 'paid',
        expenseDate || null, vendor?.trim() || null, invoiceNumber?.trim() || null, notes?.trim() || null,
        receiptUrl || null, expenseId, projectId, subcategory?.trim() || null, material?.trim() || null,
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
