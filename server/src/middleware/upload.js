import { randomUUID } from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs'
import multer from 'multer'

// Real file uploads to local disk, served back as a plain static URL. Not
// Supabase Storage — no Supabase project is actually connected to this app
// (confirmed: no client, no credentials configured anywhere), so this is the
// honest substitute given the infrastructure that's actually deployed. On
// Render's free tier this disk is ephemeral (wiped on redeploy) — acceptable
// for now, called out explicitly rather than silently shipped; swapping to
// Supabase Storage or another object store later only means changing
// `saveUploadedFile`'s return URL, not any caller.
export const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
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

export function publicUploadUrl(filename) {
  return `/uploads/${filename}`
}
