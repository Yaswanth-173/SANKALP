import BudgetCategoryDef from '../models/BudgetCategoryDef.js'
import BudgetCategory from '../models/BudgetCategory.js'
import Expense from '../models/Expense.js'
import Project from '../models/Project.js'
import { canAccessProject } from './projectsController.js'
import { uuidId } from '../models/_shared.js'

const PAYMENT_MODES = ['cash', 'upi', 'card', 'bank_transfer']

const publicCategoryDef = (c) => ({
  id: c._id,
  name: c.name,
  description: c.description,
  parentCategoryId: c.parent_category_id,
  isActive: c.is_active,
  sortOrder: c.sort_order,
  createdAt: c.created_at,
  updatedAt: c.updated_at,
})

async function getActiveCategoryNames() {
  const defs = await BudgetCategoryDef.find({ is_active: true }).sort({ sort_order: 1, name: 1 }).select('name').lean()
  return defs.map((d) => d.name)
}

export async function listBudgetCategoriesHandler(req, res) {
  try {
    const includeInactive = req.query.all === 'true' && req.user.role === 'admin'
    const filter = includeInactive ? {} : { is_active: true }
    const categories = await BudgetCategoryDef.find(filter).sort({ sort_order: 1, name: 1 }).lean()
    res.json({ categories: categories.map(publicCategoryDef) })
  } catch (err) {
    console.error('List budget categories error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function createBudgetCategoryHandler(req, res) {
  const { name, description, parentCategoryId } = req.body ?? {}
  if (!name || !name.trim()) return res.status(400).json({ message: 'Enter a category name' })

  try {
    const maxDoc = await BudgetCategoryDef.findOne().sort({ sort_order: -1 }).select('sort_order').lean()
    const nextSortOrder = maxDoc ? maxDoc.sort_order + 1 : 0
    const category = await BudgetCategoryDef.create({
      name: name.trim(),
      description: description?.trim() || null,
      parent_category_id: parentCategoryId || null,
      sort_order: nextSortOrder,
    })
    res.status(201).json({ category: publicCategoryDef(category.toObject()) })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A category with this name already exists' })
    console.error('Create budget category error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function updateBudgetCategoryHandler(req, res) {
  const { id } = req.params
  const { name, description, parentCategoryId } = req.body ?? {}
  if (!name || !name.trim()) return res.status(400).json({ message: 'Enter a category name' })

  try {
    const category = await BudgetCategoryDef.findOneAndUpdate(
      { _id: id },
      { $set: { name: name.trim(), description: description?.trim() || null, parent_category_id: parentCategoryId || null, updated_at: new Date() } },
      { returnDocument: 'after' }
    ).lean()
    if (!category) return res.status(404).json({ message: 'Category not found' })
    res.json({ category: publicCategoryDef(category) })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A category with this name already exists' })
    console.error('Update budget category error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function toggleBudgetCategoryActiveHandler(req, res) {
  const { id } = req.params
  const { isActive } = req.body ?? {}
  try {
    const category = await BudgetCategoryDef.findOneAndUpdate(
      { _id: id },
      { $set: { is_active: !!isActive, updated_at: new Date() } },
      { returnDocument: 'after' }
    ).lean()
    if (!category) return res.status(404).json({ message: 'Category not found' })
    res.json({ category: publicCategoryDef(category) })
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
    await Promise.all(
      orderedIds.map((id, i) => BudgetCategoryDef.updateOne({ _id: id }, { $set: { sort_order: i, updated_at: new Date() } }))
    )
    const categories = await BudgetCategoryDef.find().sort({ sort_order: 1, name: 1 }).lean()
    res.json({ categories: categories.map(publicCategoryDef) })
  } catch (err) {
    console.error('Reorder budget categories error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

const publicExpense = (e) => ({
  id: e._id,
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

    const project = await Project.findById(projectId).select('total_budget').lean()
    if (!project) return res.status(404).json({ message: 'Project not found' })
    const totalBudget = project.total_budget != null ? Number(project.total_budget) : 0

    const defRows = await BudgetCategoryDef.find().sort({ sort_order: 1, name: 1 }).select('name sort_order is_active').lean()
    const budgetRows = await BudgetCategory.find({ project_id: projectId }).select('category budgeted_amount').lean()
    const budgetByCategory = new Map(budgetRows.map((r) => [r.category, Number(r.budgeted_amount)]))

    const spentRows = await Expense.aggregate([
      { $match: { project_id: projectId } },
      { $group: { _id: '$category', spent: { $sum: '$amount' }, count: { $sum: 1 } } },
    ])
    const spentByCategory = new Map(spentRows.map((r) => [r._id, Number(r.spent)]))
    const totalExpenseCount = spentRows.reduce((sum, r) => sum + r.count, 0)

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

    const recentExpenses = await Expense.find({ project_id: projectId }).sort({ expense_date: -1, created_at: -1 }).limit(10).lean()

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

    await Promise.all(
      categories.map((c) =>
        BudgetCategory.updateOne(
          { project_id: projectId, category: c.category },
          { $set: { budgeted_amount: c.budgetedAmount, updated_at: new Date() }, $setOnInsert: { _id: uuidId() } },
          { upsert: true }
        )
      )
    )
    if (totalBudget != null) {
      await Project.updateOne({ _id: projectId }, { $set: { total_budget: Number(totalBudget), updated_at: new Date() } })
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

    const expenses = await Expense.find({ project_id: projectId }).sort({ expense_date: -1, created_at: -1 }).lean()
    res.json({ expenses: expenses.map(publicExpense) })
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

function todayDateKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

    const expense = await Expense.create({
      project_id: projectId,
      created_by: req.user.id,
      category,
      description: description.trim(),
      amount: amountNum,
      payment_mode: paymentMode || 'cash',
      status: status === 'pending' ? 'pending' : 'paid',
      expense_date: expenseDate || todayDateKey(),
      vendor: vendor?.trim() || null,
      invoice_number: invoiceNumber?.trim() || null,
      notes: notes?.trim() || null,
      receipt_url: receiptUrl || null,
      subcategory: subcategory?.trim() || null,
      material: material?.trim() || null,
    })
    res.status(201).json({ expense: publicExpense(expense.toObject()) })
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

    const patch = {
      category, description: description.trim(), amount: amountNum, payment_mode: paymentMode || 'cash',
      status: status === 'pending' ? 'pending' : 'paid', vendor: vendor?.trim() || null, invoice_number: invoiceNumber?.trim() || null,
      notes: notes?.trim() || null, subcategory: subcategory?.trim() || null, material: material?.trim() || null, updated_at: new Date(),
    }
    if (expenseDate) patch.expense_date = expenseDate
    if (receiptUrl) patch.receipt_url = receiptUrl

    const expense = await Expense.findOneAndUpdate({ _id: expenseId, project_id: projectId }, { $set: patch }, { returnDocument: 'after' }).lean()
    if (!expense) return res.status(404).json({ message: 'Expense not found' })
    res.json({ expense: publicExpense(expense) })
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

    const deleted = await Expense.findOneAndDelete({ _id: expenseId, project_id: projectId })
    if (!deleted) return res.status(404).json({ message: 'Expense not found' })
    res.json({ message: 'Expense deleted' })
  } catch (err) {
    console.error('Delete expense error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}
