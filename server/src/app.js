import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import authRoutes from './routes/auth.routes.js'
import calendarRoutes from './routes/calendar.routes.js'
import notesRoutes from './routes/notes.routes.js'
import messagesRoutes from './routes/messages.routes.js'
import contractorsRoutes from './routes/contractors.routes.js'
import tasksRoutes from './routes/tasks.routes.js'
import materialsRoutes from './routes/materials.routes.js'

const app = express()

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.disable('x-powered-by')
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/notes', notesRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/contractors', contractorsRoutes)
app.use('/api/tasks', tasksRoutes)
app.use('/api/materials', materialsRoutes)

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request payload is too large' })
  }
  console.error('Unhandled request error', err)
  return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' })
})

export default app
