import { randomUUID } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import multer from 'multer'

// Real file uploads to local disk. Not Supabase Storage — no Supabase
// project is actually connected to this app (confirmed: no client, no
// credentials configured anywhere), so this is the honest substitute given
// the infrastructure that's actually deployed.
//
// On Vercel, the deployed function bundle is read-only outside `/tmp`, and
// `/tmp` itself doesn't survive between invocations on a different (or
// re-spun) container — so uploads here do not persist reliably in that
// environment. This keeps the app from crashing on cold start rather than
// solving persistence; a real fix means moving to an object store (Vercel
// Blob, S3, Cloudinary) and is a deliberate follow-up, not done here.
//
// Files are never served from a public/static path. Each upload is recorded
// as a row in `project_files` (project_id, uploaded_by, mime type, size) and
// read back through GET /api/files/:fileId (see filesController.js), which
// re-checks the requester's project membership on every read. Swapping to
// an object store later only means changing where filesController
// writes/reads bytes, not the authorization model.
export const UPLOAD_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'sankalp-uploads')
  : path.join(process.cwd(), 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const ALLOWED_DOCUMENT_TYPES = new Set([...ALLOWED_IMAGE_TYPES, 'application/pdf'])
const MAX_FILE_BYTES = 8 * 1024 * 1024 // 8MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ''
    cb(null, `${randomUUID()}${ext}`)
  },
})

function makeUploader(allowedTypes) {
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_BYTES, files: 6 },
    fileFilter: (req, file, cb) => {
      if (!allowedTypes.has(file.mimetype)) {
        return cb(new Error('UNSUPPORTED_FILE_TYPE'))
      }
      cb(null, true)
    },
  })
}

export const uploadImages = makeUploader(ALLOWED_IMAGE_TYPES)
export const uploadDocument = makeUploader(ALLOWED_DOCUMENT_TYPES)

export function handleMulterError(err, req, res, next) {
  if (err) {
    if (err.message === 'UNSUPPORTED_FILE_TYPE') return res.status(400).json({ message: 'Unsupported file type' })
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'File is too large (max 8MB)' })
    return res.status(400).json({ message: 'Upload failed' })
  }
  next()
}
