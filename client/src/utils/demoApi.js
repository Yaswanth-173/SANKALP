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

function readData() {
  const fallback = {
    notes: [],
    events: [],
    tasks: [],
    contacts: [],
    messages: {},
    orders: [],
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
