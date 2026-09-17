import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import authRoutes from './routes/auth.routes.js'
import calendarRoutes from './routes/calendar.routes.js'
import notesRoutes from './routes/notes.routes.js'
import messagesRoutes from './routes/messages.routes.js'
import contractorsRoutes from './routes/contractors.routes.js'
import tasksRoutes from './routes/tasks.routes.js'
import materialsRoutes from './routes/materials.routes.js'

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())
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

export default app
