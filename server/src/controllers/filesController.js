import fs from 'node:fs'
import path from 'node:path'
import { query } from '../config/db.js'
import { canAccessProject } from './projectsController.js'
import { UPLOAD_DIR } from '../middleware/upload.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function insertFileRow({ projectId, uploadedBy, kind, file }) {
  const { rows } = await query(
    `INSERT INTO project_files (project_id, uploaded_by, kind, filename, original_name, mime_type, size_bytes)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [projectId, uploadedBy, kind, file.filename, file.originalname, file.mimetype, file.size]
  )
  return rows[0].id
}

export async function uploadProjectImages(req, res) {
  const { id: projectId } = req.params
  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })
    if (!req.files?.length) return res.status(400).json({ message: 'No files uploaded' })

    const files = []
    for (const f of req.files) {
      const id = await insertFileRow({ projectId, uploadedBy: req.user.id, kind: 'photo', file: f })
      files.push({ id, url: `/api/files/${id}` })
    }
    res.status(201).json({ files })
  } catch (err) {
    console.error('Upload project images error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function uploadProjectDocument(req, res) {
  const { id: projectId } = req.params
  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    const id = await insertFileRow({ projectId, uploadedBy: req.user.id, kind: 'document', file: req.file })
    res.status(201).json({ id, url: `/api/files/${id}` })
  } catch (err) {
    console.error('Upload project document error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// Every read re-checks project membership — a valid session from a
// different project (or no project at all) gets the same 404 as a
// made-up id, so the response never confirms a file exists.
export async function getFile(req, res) {
  const { fileId } = req.params
  if (!UUID_RE.test(fileId)) return res.status(404).json({ message: 'Not found' })

  try {
    const { rows } = await query('SELECT * FROM project_files WHERE id = $1', [fileId])
    if (!rows.length) return res.status(404).json({ message: 'Not found' })
    const file = rows[0]

    const allowed = await canAccessProject(req.user.id, req.user.role, file.project_id)
    if (!allowed) return res.status(404).json({ message: 'Not found' })

    const filePath = path.join(UPLOAD_DIR, file.filename)
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Not found' })

    res.setHeader('Content-Type', file.mime_type)
    res.setHeader('Cache-Control', 'private, max-age=3600')
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_name || file.filename)}"`)
    res.sendFile(filePath)
  } catch (err) {
    console.error('Get file error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}
