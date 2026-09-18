const DEMO_USER = {
  id: 'demo-user',
  fullName: 'Yaswanth Chowdary',
  username: 'yaswanthchowdary2117',
  email: import.meta.env.VITE_DEMO_EMAIL || 'demo@example.com',
  phone: '+919876543210',
  role: 'customer',
  location: 'Markapur',
  preferences: { theme: 'dark', language: 'en', emailNotifications: true },
}

const STORAGE_KEY = 'sankalp_demo_data'
const id = () => `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

// Mirrors server/src/db/ensureSchema.js's seeded defaults and
// server/src/controllers/progressController.js's MILESTONES thresholds —
// the demo layer has no server to ask, so these are the same fixed values
// the real backend would otherwise supply.
const DEMO_BUDGET_CATEGORIES = ['Foundation', 'Structure', 'Electrical', 'Plumbing', 'Finishing', 'Others']
const DEMO_MILESTONES = [
  { key: 'foundation', label: 'Foundation Work', threshold: 15 },
  { key: 'plinth', label: 'Plinth & Columns', threshold: 30 },
  { key: 'walls', label: 'Wall Construction', threshold: 55 },
  { key: 'electrical', label: 'Electrical Work', threshold: 75 },
  { key: 'plumbing', label: 'Plumbing Work', threshold: 90 },
  { key: 'finishing', label: 'Finishing', threshold: 100 },
]

function buildDemoMilestones(project) {
  const progress = project.progressPercent || 0
  let ranges = null
  if (project.startDate && project.expectedCompletion) {
    const start = new Date(project.startDate)
    const end = new Date(project.expectedCompletion)
    const totalDays = Math.max(1, Math.round((end - start) / 86400000))
    const perPhase = totalDays / DEMO_MILESTONES.length
    const addDays = (d, days) => { const next = new Date(d); next.setDate(next.getDate() + days); return next }
    ranges = DEMO_MILESTONES.map((_, i) => ({ start: addDays(start, Math.round(i * perPhase)), end: addDays(start, Math.round((i + 1) * perPhase)) }))
  }
  let prevThreshold = 0
  return DEMO_MILESTONES.map((m, i) => {
    let status = 'pending'
    if (progress >= m.threshold) status = 'completed'
    else if (progress >= prevThreshold) status = 'in_progress'
    prevThreshold = m.threshold
    return { key: m.key, label: m.label, status, startDate: ranges?.[i]?.start.toISOString().slice(0, 10) ?? null, endDate: ranges?.[i]?.end.toISOString().slice(0, 10) ?? null }
  })
}

function readData() {
  const fallback = {
    notes: [],
    events: [],
    tasks: [],
    contacts: [],
    messages: {},
    orders: [],
    projects: [],
    projectUpdates: {},
    budgets: {},
    expenses: {},
    preferences: DEMO_USER.preferences,
  }
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  } catch {
    return fallback
  }
}

function writeData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const shops = [
  {
    id: 'demo-shop-1', name: 'Markapur Building Materials', category: 'Cement', location: 'Markapur',
    address: 'Main Road, Markapur, Andhra Pradesh', latitude: 15.74, longitude: 79.27, rating: 4.5,
    deliveryAvailable: true, deliveryEtaHours: 48, distanceKm: null,
    products: [
      { id: 'demo-product-1', name: 'OPC Cement', unit: '50 kg bag', price: 420, imageUrl: null, stockStatus: 'in_stock', stock: 50 },
      { id: 'demo-product-2', name: 'PPC Cement', unit: '50 kg bag', price: 390, imageUrl: null, stockStatus: 'in_stock', stock: 40 },
    ],
  },
]

function response(data) {
  return Promise.resolve(data)
}

export function demoUser() {
  return { ...DEMO_USER, email: import.meta.env.VITE_DEMO_EMAIL || DEMO_USER.email }
}

export function demoLogin(email, password) {
  const expectedEmail = import.meta.env.VITE_DEMO_EMAIL || DEMO_USER.email
  const expectedPassword = import.meta.env.VITE_DEMO_PASSWORD || 'change-me-locally'
  if (email.trim().toLowerCase() !== expectedEmail.toLowerCase() || password !== expectedPassword) {
    throw new Error('Invalid demo email or password')
  }
  localStorage.setItem('sankalp_demo_session', '1')
  return response({ user: demoUser() })
}

export function demoLogout() {
  localStorage.removeItem('sankalp_demo_session')
  return response({ message: 'Logged out' })
}

export function demoSession() {
  return localStorage.getItem('sankalp_demo_session') === '1' ? response({ user: demoUser() }) : Promise.reject(new Error('Not authenticated'))
}

export async function demoFetch(path, options = {}) {
  const method = options.method || 'GET'
  const data = readData()
  const body = options.body ? JSON.parse(options.body) : {}

  if (path === '/api/auth/profile' && method === 'PATCH') {
    Object.assign(DEMO_USER, { fullName: body.fullName, phone: body.phone, location: body.location || null })
    return response({ user: demoUser() })
  }
  if (path === '/api/auth/preferences' && method === 'PATCH') {
    data.preferences = { ...data.preferences, ...body }
    writeData(data)
    return response({ user: { ...demoUser(), preferences: data.preferences } })
  }
  if (path === '/api/materials/shops') return response({ shops })
  if (path === '/api/materials/orders') {
    if (method === 'GET') return response({ orders: data.orders })
    const shop = shops.find((item) => item.id === body.shopId) || shops[0]
    const items = (body.items || []).map((item) => {
      const product = shop.products.find((productItem) => productItem.id === item.productId)
      return { productName: product?.name || 'Demo material', unit: product?.unit || 'unit', unitPrice: product?.price || 0, quantity: item.quantity }
    })
    const order = { id: id(), displayId: `MO-${data.orders.length + 101}`, shopId: shop.id, shopName: shop.name, totalAmount: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), status: 'placed', createdAt: new Date().toISOString(), items }
    data.orders = [order, ...data.orders]
    writeData(data)
    return response({ order })
  }
  if (path === '/api/contractors') return response({ contractors: [] })
  if (path === '/api/budget-categories') {
    return response({ categories: DEMO_BUDGET_CATEGORIES.map((name, i) => ({ id: name, name, description: null, parentCategoryId: null, isActive: true, sortOrder: i })) })
  }

  if (path === '/api/projects') {
    if (method === 'GET') return response({ projects: data.projects })
    const project = {
      id: id(),
      name: body.name?.trim(),
      location: body.location?.trim() || null,
      address: body.address?.trim() || null,
      projectType: body.projectType || null,
      description: body.description?.trim() || null,
      status: 'active',
      customerId: DEMO_USER.id,
      progressPercent: 0,
      startDate: body.startDate || null,
      expectedCompletion: body.expectedCompletion || null,
      totalBudget: body.totalBudget != null && body.totalBudget !== '' ? Number(body.totalBudget) : null,
      imageUrl: null,
      createdAt: new Date().toISOString(),
    }
    data.projects = [project, ...data.projects]
    data.budgets[project.id] = { totalBudget: project.totalBudget || 0, categories: {} }
    data.projectUpdates[project.id] = []
    data.expenses[project.id] = []
    writeData(data)
    return response({ project })
  }

  if (path.match(/^\/api\/projects\/[^/]+$/)) {
    const projectId = path.split('/')[3]
    const project = data.projects.find((p) => p.id === projectId)
    if (!project) return Promise.reject(Object.assign(new Error('Project not found'), { status: 404 }))
    if (method === 'PUT') {
      Object.assign(project, {
        name: body.name != null ? body.name.trim() : project.name,
        location: body.location !== undefined ? (body.location?.trim() || null) : project.location,
        address: body.address !== undefined ? (body.address?.trim() || null) : project.address,
        projectType: body.projectType !== undefined ? (body.projectType || null) : project.projectType,
        description: body.description !== undefined ? (body.description?.trim() || null) : project.description,
        startDate: body.startDate !== undefined ? (body.startDate || null) : project.startDate,
        expectedCompletion: body.expectedCompletion !== undefined ? (body.expectedCompletion || null) : project.expectedCompletion,
        totalBudget: body.totalBudget !== undefined ? (body.totalBudget !== '' && body.totalBudget != null ? Number(body.totalBudget) : null) : project.totalBudget,
        imageUrl: body.imageUrl !== undefined ? (body.imageUrl || null) : project.imageUrl,
      })
      writeData(data)
      return response({ project })
    }
    return response({ project: { ...project, members: [] } })
  }

  if (path.match(/^\/api\/projects\/[^/]+\/progress$/) && method === 'GET') {
    const projectId = path.split('/')[3]
    const project = data.projects.find((p) => p.id === projectId)
    if (!project) return Promise.reject(Object.assign(new Error('Project not found'), { status: 404 }))
    const updates = data.projectUpdates[projectId] || []
    const projectTasks = data.tasks.filter((t) => t.projectId === projectId)
    const taskCounts = { pending: 0, in_progress: 0, completed: 0 }
    for (const t of projectTasks) taskCounts[t.status] = (taskCounts[t.status] || 0) + 1
    return response({ project, milestones: buildDemoMilestones(project), updates, taskCounts })
  }

  if (path.match(/^\/api\/projects\/[^/]+\/progress-updates$/) && method === 'POST') {
    const projectId = path.split('/')[3]
    const project = data.projects.find((p) => p.id === projectId)
    if (!project) return Promise.reject(Object.assign(new Error('Project not found'), { status: 404 }))
    const update = {
      id: id(),
      title: body.title?.trim(),
      description: body.description?.trim() || null,
      progressPercent: body.progressPercent ?? null,
      photoUrls: Array.isArray(body.photoUrls) ? body.photoUrls.slice(0, 6) : [],
      location: body.location?.trim() || null,
      authorName: DEMO_USER.fullName,
      authorRole: DEMO_USER.role,
      authorId: DEMO_USER.id,
      taskId: body.taskId || null,
      taskTitle: data.tasks.find((t) => t.id === body.taskId)?.title || null,
      contractorId: null,
      contractorName: null,
      createdAt: new Date().toISOString(),
    }
    data.projectUpdates[projectId] = [update, ...(data.projectUpdates[projectId] || [])]
    if (update.progressPercent != null) project.progressPercent = update.progressPercent
    writeData(data)
    return response({ update })
  }

  if (path.match(/^\/api\/projects\/[^/]+\/progress-updates\/[^/]+$/)) {
    const parts = path.split('/')
    const projectId = parts[3]
    const updateId = parts[5]
    const project = data.projects.find((p) => p.id === projectId)
    const list = data.projectUpdates[projectId] || []
    if (method === 'DELETE') {
      data.projectUpdates[projectId] = list.filter((u) => u.id !== updateId)
      const latestWithProgress = data.projectUpdates[projectId].find((u) => u.progressPercent != null)
      if (project) project.progressPercent = latestWithProgress ? latestWithProgress.progressPercent : 0
      writeData(data)
      return response({ message: 'Update deleted' })
    }
    const update = list.find((u) => u.id === updateId)
    if (!update) return Promise.reject(Object.assign(new Error('Update not found'), { status: 404 }))
    Object.assign(update, {
      title: body.title?.trim() ?? update.title,
      description: body.description !== undefined ? (body.description?.trim() || null) : update.description,
      progressPercent: body.progressPercent !== undefined ? body.progressPercent : update.progressPercent,
      photoUrls: Array.isArray(body.photoUrls) ? body.photoUrls.slice(0, 6) : update.photoUrls,
      location: body.location !== undefined ? (body.location?.trim() || null) : update.location,
    })
    if (project && list[0]?.id === updateId && update.progressPercent != null) project.progressPercent = update.progressPercent
    writeData(data)
    return response({ update })
  }

  if (path.match(/^\/api\/projects\/[^/]+\/tasks$/) && method === 'GET') {
    const projectId = path.split('/')[3]
    return response({ tasks: data.tasks.filter((t) => t.projectId === projectId) })
  }

  if (path.match(/^\/api\/projects\/[^/]+\/tasks\/[^/]+\/progress$/) && method === 'PATCH') {
    const parts = path.split('/')
    const taskId = parts[5]
    const task = data.tasks.find((t) => t.id === taskId)
    if (!task) return Promise.reject(Object.assign(new Error('Task not found'), { status: 404 }))
    if (body.status) {
      task.status = body.status
      if (body.status === 'in_progress') task.startedAt = new Date().toISOString()
      if (body.status === 'completed') task.completedAt = new Date().toISOString()
    }
    if (body.progressPercent != null) task.progressPercent = body.progressPercent
    writeData(data)
    return response({ task })
  }

  if (path.match(/^\/api\/projects\/[^/]+\/tasks\/[^/]+$/) && method === 'DELETE') {
    const parts = path.split('/')
    const taskId = parts[5]
    data.tasks = data.tasks.filter((t) => t.id !== taskId)
    writeData(data)
    return response({ message: 'Task removed' })
  }

  if (path.match(/^\/api\/projects\/[^/]+\/contractors$/) && method === 'GET') {
    return response({ contractors: [] })
  }

  if (path.match(/^\/api\/projects\/[^/]+\/budget$/)) {
    const projectId = path.split('/')[3]
    const project = data.projects.find((p) => p.id === projectId)
    if (!project) return Promise.reject(Object.assign(new Error('Project not found'), { status: 404 }))
    const budget = data.budgets[projectId] || { totalBudget: project.totalBudget || 0, categories: {} }
    if (method === 'PUT') {
      for (const c of body.categories || []) budget.categories[c.category] = c.budgetedAmount
      if (body.totalBudget != null) { budget.totalBudget = Number(body.totalBudget); project.totalBudget = Number(body.totalBudget) }
      data.budgets[projectId] = budget
      writeData(data)
      return response({ message: 'Budget updated' })
    }
    const projectExpenses = data.expenses[projectId] || []
    const categories = DEMO_BUDGET_CATEGORIES.map((name) => ({
      category: name,
      budgetedAmount: budget.categories[name] || 0,
      spentAmount: projectExpenses.filter((e) => e.category === name).reduce((sum, e) => sum + e.amount, 0),
    }))
    const totalSpent = categories.reduce((sum, c) => sum + c.spentAmount, 0)
    const totalBudget = budget.totalBudget || project.totalBudget || 0
    return response({
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
      totalExpenseCount: projectExpenses.length,
      categories,
      recentExpenses: projectExpenses.slice(0, 10),
    })
  }

  if (path.match(/^\/api\/projects\/[^/]+\/expenses$/)) {
    const projectId = path.split('/')[3]
    if (method === 'GET') return response({ expenses: data.expenses[projectId] || [] })
    const expense = {
      id: id(),
      category: body.category,
      description: body.description?.trim(),
      amount: Number(body.amount) || 0,
      paymentMode: body.paymentMode || 'cash',
      status: body.status === 'pending' ? 'pending' : 'paid',
      expenseDate: body.expenseDate || new Date().toISOString().slice(0, 10),
      subcategory: body.subcategory?.trim() || null,
      material: body.material?.trim() || null,
      vendor: body.vendor?.trim() || null,
      invoiceNumber: body.invoiceNumber?.trim() || null,
      notes: body.notes?.trim() || null,
      receiptUrl: body.receiptUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    data.expenses[projectId] = [expense, ...(data.expenses[projectId] || [])]
    writeData(data)
    return response({ expense })
  }

  if (path.match(/^\/api\/projects\/[^/]+\/expenses\/[^/]+$/)) {
    const parts = path.split('/')
    const projectId = parts[3]
    const expenseId = parts[5]
    const list = data.expenses[projectId] || []
    if (method === 'DELETE') {
      data.expenses[projectId] = list.filter((e) => e.id !== expenseId)
      writeData(data)
      return response({ message: 'Expense deleted' })
    }
    const expense = list.find((e) => e.id === expenseId)
    if (!expense) return Promise.reject(Object.assign(new Error('Expense not found'), { status: 404 }))
    Object.assign(expense, {
      category: body.category ?? expense.category,
      description: body.description !== undefined ? body.description.trim() : expense.description,
      amount: body.amount !== undefined ? Number(body.amount) || 0 : expense.amount,
      paymentMode: body.paymentMode ?? expense.paymentMode,
      status: body.status === 'pending' ? 'pending' : 'paid',
      expenseDate: body.expenseDate || expense.expenseDate,
      subcategory: body.subcategory !== undefined ? (body.subcategory?.trim() || null) : expense.subcategory,
      material: body.material !== undefined ? (body.material?.trim() || null) : expense.material,
      vendor: body.vendor !== undefined ? (body.vendor?.trim() || null) : expense.vendor,
      invoiceNumber: body.invoiceNumber !== undefined ? (body.invoiceNumber?.trim() || null) : expense.invoiceNumber,
      notes: body.notes !== undefined ? (body.notes?.trim() || null) : expense.notes,
      receiptUrl: body.receiptUrl !== undefined ? (body.receiptUrl || null) : expense.receiptUrl,
      updatedAt: new Date().toISOString(),
    })
    writeData(data)
    return response({ expense })
  }
  if (path === '/api/notes') {
    if (method === 'GET') return response({ notes: data.notes })
    const note = { id: id(), title: body.title || null, content: body.content, color: body.color || 'gold', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    data.notes = [note, ...data.notes]
    writeData(data)
    return response({ note })
  }
  if (path.startsWith('/api/notes/')) {
    const noteId = path.split('/').pop()
    if (method === 'DELETE') { data.notes = data.notes.filter((note) => note.id !== noteId); writeData(data); return response({ message: 'Note deleted' }) }
    const note = data.notes.find((item) => item.id === noteId)
    Object.assign(note, body, { updatedAt: new Date().toISOString() })
    writeData(data)
    return response({ note })
  }
  if (path.startsWith('/api/calendar/events')) {
    if (method === 'GET') return response({ events: data.events })
    if (method === 'POST') {
      const event = { id: id(), ...body, createdAt: new Date().toISOString() }
      data.events.push(event); writeData(data); return response({ event })
    }
    const eventId = path.split('/').pop()
    data.events = data.events.filter((event) => event.id !== eventId)
    writeData(data)
    return response({ message: 'Event deleted' })
  }
  if (path === '/api/tasks') {
    if (method === 'GET') return response({ tasks: data.tasks })
    const task = { id: id(), ...body, status: 'pending', createdAt: new Date().toISOString() }
    data.tasks = [task, ...data.tasks]; writeData(data); return response({ task })
  }
  if (path.startsWith('/api/tasks/')) {
    const parts = path.split('/')
    const taskId = parts[3]
    const task = data.tasks.find((item) => item.id === taskId)
    if (method === 'DELETE') {
      data.tasks = data.tasks.filter((item) => item.id !== taskId)
      writeData(data)
      return response({ message: 'Task removed' })
    }
    if (task && parts[4] === 'status') {
      task.status = body.status
      if (body.status === 'in_progress') task.startedAt = new Date().toISOString()
      if (body.status === 'completed') task.completedAt = new Date().toISOString()
      writeData(data)
      return response({ task })
    }
  }
  if (path === '/api/messages/contacts') {
    if (method === 'GET') return response({ contacts: data.contacts })
    const contact = { id: id(), ...body, createdAt: new Date().toISOString() }
    data.contacts = [contact, ...data.contacts]; data.messages[contact.id] = []; writeData(data); return response({ contact })
  }
  if (path.startsWith('/api/messages/contacts/')) {
    const parts = path.split('/')
    const contactId = parts[4]
    if (parts[5] === 'messages') {
      if (method === 'GET') return response({ messages: data.messages[contactId] || [] })
      const message = { id: id(), contactId, sender: 'customer', content: body.content, createdAt: new Date().toISOString() }
      data.messages[contactId] = [...(data.messages[contactId] || []), message]; writeData(data); return response({ chatMessage: message })
    }
    data.contacts = data.contacts.filter((contact) => contact.id !== contactId); delete data.messages[contactId]; writeData(data); return response({ message: 'Contact removed' })
  }

  return response({})
}
