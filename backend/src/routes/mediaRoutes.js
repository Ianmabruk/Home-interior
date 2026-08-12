import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { uploadSingle } from '../middleware/upload.js'
import { validateCsrfToken } from '../middleware/csrf.js'
import { ApiError } from '../utils/ApiError.js'

const router = Router()

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']

router.post('/upload', authenticate, validateCsrfToken, uploadSingle('media'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded')
  }
  const folder = req.body.folder || 'uploads'
  const type = req.body.resourceType || 'image'
  const allowed = type === 'video' ? [...IMAGE_TYPES, ...VIDEO_TYPES] : IMAGE_TYPES
  if (!allowed.includes(req.file.mimetype)) {
    throw new ApiError(400, 'Invalid file type')
  }
  const uploaded = await uploadFile(req.file.buffer, req.file.mimetype, folder)
  res.status(201).json({ success: true, data: { url: uploaded.url, path: uploaded.path } })
}))

router.post('/delete', authenticate, validateCsrfToken, asyncHandler(async (req, res) => {
  const { publicId, resourceType } = req.body
  if (!publicId) {
    throw new ApiError(400, 'publicId is required')
  }
  await deleteFile(publicId)
  res.json({ success: true, data: { message: 'Deleted' } })
}))

export default router
