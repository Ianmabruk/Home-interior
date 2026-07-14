import { Router } from 'express'
import multer from 'multer'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { projectV2Controller } from '../controllers/projectV2Controller.js'
import { auth, authorize } from '../middleware/auth.js'
import { validateFileUpload, sanitizeInput } from '../middleware/validate.js'
import { auditLog } from '../middleware/auditLog.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
})

const writeLimiter = rateLimit({
  windowMs: 1000 * 60,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many write requests, please slow down.' },
})

const validateVideo = validateFileUpload('video', {
  maxBytes: 50 * 1024 * 1024,
  allowedMime: ['video/mp4', 'video/webm', 'video/quicktime'],
})

const reorderSchema = z.object({
  order: z.array(z.string().uuid()).min(1, 'order must be a non-empty array'),
})

router.get('/', projectV2Controller.list)

router.post(
  '/upload',
  auth,
  authorize('admin'),
  writeLimiter,
  auditLog,
  upload.single('video'),
  validateVideo,
  sanitizeInput,
  projectV2Controller.upload,
)

router.patch(
  '/:id/publish',
  auth,
  authorize('admin'),
  writeLimiter,
  auditLog,
  sanitizeInput,
  projectV2Controller.togglePublish,
)

router.patch(
  '/reorder',
  auth,
  authorize('admin'),
  writeLimiter,
  auditLog,
  sanitizeInput,
  projectV2Controller.reorder,
)

router.delete(
  '/:id',
  auth,
  authorize('admin'),
  writeLimiter,
  auditLog,
  projectV2Controller.remove,
)

export default router
