import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { uploadImages, uploadDocument, publicUploadUrl } from '../middleware/upload.js'

const router = Router()

router.use(requireAuth)

function handleMulterError(err, req, res, next) {
  if (err) {
    if (err.message === 'UNSUPPORTED_FILE_TYPE') {
      return res.status(400).json({ message: 'Unsupported file type' })
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large (max 8MB)' })
    }
    return res.status(400).json({ message: 'Upload failed' })
  }
  next()
}

// Multiple images at once — used for progress-update site photos.
router.post('/images', (req, res, next) => {
  uploadImages.array('files', 6)(req, res, (err) => handleMulterError(err, req, res, next))
}, (req, res) => {
  if (!req.files?.length) return res.status(400).json({ message: 'No files uploaded' })
  res.status(201).json({ urls: req.files.map((f) => publicUploadUrl(f.filename)) })
})

// A single document/receipt — used for expense receipts (image or PDF).
router.post('/document', (req, res, next) => {
  uploadDocument.single('file')(req, res, (err) => handleMulterError(err, req, res, next))
}, (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
  res.status(201).json({ url: publicUploadUrl(req.file.filename) })
})

export default router
