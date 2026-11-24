import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { uploadFile } from '../uploads/uploadService.js'
import { uploadSingle, uploadArray } from '../middleware/upload.js'
import { validateCsrfToken } from '../middleware/csrf.js'
import { generateCsrfToken } from '../middleware/csrf.js'
import { ApiError } from '../utils/ApiError.js'
import { uploadVideo, isVideoCloudinaryConfigured } from '../services/cloudinaryVideoService.js'
import { uploadImage, isImageCloudinaryConfigured } from '../services/cloudinaryImageService.js'
import {
  getHyperserveVideo,
} from '../services/hyperserveService.js'

const router = Router()

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const VIDEO_TYPES = [
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
  'video/webm', 'video/x-flv', 'video/x-ms-wmv', 'video/mpeg',
  'video/mp2t', 'application/octet-stream',
]
const MAX_BATCH_FILES = 50

// Legacy Hyperserve endpoints - ONLY for checking status of existing videos
// New video uploads MUST use /video/upload (Cloudinary Video account)
router.get('/hyperserve/:id/status', authenticate, asyncHandler(async (req, res) => {
  const result = await getHyperserveVideo(req.params.id, req.query.private !== 'true')
  res.json({ success: true, data: result })
}))

router.delete('/hyperserve/:id', authenticate, validateCsrfToken, asyncHandler(async (req, res) => {
  res.status(410).json({ success: false, message: 'Media deletion is disabled to preserve existing assets' })
}))

router.post('/video/upload', authenticate, validateCsrfToken, uploadSingle('media', VIDEO_TYPES), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded')
  }
  if (!isVideoCloudinaryConfigured()) {
    throw new ApiError(503, 'Video upload service is not configured. Contact support.')
  }
  const folder = req.body.folder || 'uploads'
  const uploadId = req.body.uploadId
  if (uploadId && (!/^[a-zA-Z0-9-]{16,64}$/.test(uploadId) || folder !== 'blogs')) {
    throw new ApiError(400, 'Invalid upload identifier')
  }
  const uploaded = await uploadVideo(
    req.file.buffer,
    req.file.mimetype,
    folder,
    req.file.originalname,
    uploadId ? `blog-video-${uploadId}` : null,
  )
  const csrfToken = generateCsrfToken()
  res.status(201).json({
    success: true,
    data: {
      url: uploaded.url,
      secureUrl: uploaded.url,
      path: uploaded.publicId,
      publicId: uploaded.publicId,
      resourceType: uploaded.resourceType || 'video',
      format: uploaded.format || null,
      mimeType: uploaded.mimeType || req.file.mimetype,
      originalName: uploaded.originalName || req.file.originalname,
      duration: uploaded.duration ?? null,
      width: uploaded.width ?? null,
      height: uploaded.height ?? null,
      bytes: uploaded.bytes ?? req.file.size,
      storageProvider: 'cloudinary',
      csrfToken,
    },
  })
}))

router.post('/upload', authenticate, validateCsrfToken, uploadSingle('media', IMAGE_TYPES), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded')
  }
  const folder = req.body.folder || 'uploads'
  if (!IMAGE_TYPES.includes(req.file.mimetype)) {
    throw new ApiError(400, 'Invalid file type')
  }
  const uploadId = req.body.uploadId
  if (uploadId && (!/^[a-zA-Z0-9-]{16,64}$/.test(uploadId) || folder !== 'blogs')) {
    throw new ApiError(400, 'Invalid upload identifier')
  }
  const uploaded = await uploadFile(
    req.file.buffer,
    req.file.mimetype,
    folder,
    req.file.originalname,
    uploadId ? `blog-media-${uploadId}` : null,
  )
  const csrfToken = generateCsrfToken()
  res.status(201).json({
    success: true,
    data: {
      url: uploaded.url,
      secureUrl: uploaded.url,
      path: uploaded.path,
      publicId: uploaded.publicId || uploaded.path,
      resourceType: uploaded.resourceType || 'image',
      format: uploaded.format || null,
      mimeType: uploaded.mimeType || req.file.mimetype,
      originalName: uploaded.originalName || req.file.originalname,
      duration: uploaded.duration ?? null,
      width: uploaded.width ?? null,
      height: uploaded.height ?? null,
      bytes: uploaded.bytes ?? req.file.size,
      csrfToken,
    },
  })
}))

router.post('/upload-batch', authenticate, validateCsrfToken, uploadArray('files', MAX_BATCH_FILES, IMAGE_TYPES), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'No files uploaded')
  }
  const folder = req.body.folder || 'uploads'
  if (req.body.resourceType === 'video') {
    throw new ApiError(400, 'Video files must use the signed direct Cloudinary uploader')
  }
  const invalidFiles = req.files.filter((f) => !IMAGE_TYPES.includes(f.mimetype))
  if (invalidFiles.length > 0) {
    throw new ApiError(400, `Invalid file type(s): ${invalidFiles.map((f) => f.mimetype).join(', ')}`)
  }

  const SERVER_ID = process.env.SERVER_ID || 'hok-api-01'
  const total = req.files.length
  console.log(`[${SERVER_ID}] [upload-batch] starting ${total} files to folder=${folder}`)

  const BATCH_CONCURRENCY = 3
  const results = []
  const errors = []

  for (let i = 0; i < total; i += BATCH_CONCURRENCY) {
    const batch = req.files.slice(i, i + BATCH_CONCURRENCY)
    const batchNum = Math.floor(i / BATCH_CONCURRENCY) + 1
    const totalBatches = Math.ceil(total / BATCH_CONCURRENCY)
    console.log(`[${SERVER_ID}] [upload-batch] processing batch ${batchNum}/${totalBatches}`)

    const settled = await Promise.allSettled(
      batch.map((file) => uploadFile(file.buffer, file.mimetype, folder)),
    )

    settled.forEach((r, j) => {
      const file = batch[j]
      const fileNum = i + j + 1
      if (r.status === 'fulfilled') {
        console.log(`[${SERVER_ID}] [upload-batch] file ${fileNum}/${total} succeeded: ${file.originalname}`)
        results.push({
          url: r.value.url,
          path: r.value.path,
          mimeType: r.value.mimeType,
          fileName: file.originalname,
        })
      } else {
        const err = r.reason
        console.error(`[${SERVER_ID}] [upload-batch] file ${fileNum}/${total} failed: ${file.originalname}`, err?.message || err)
        errors.push({
          fileName: file.originalname,
          error: err?.message || 'Upload failed',
          fileNum,
        })
      }
    })
  }

  console.log(`[${SERVER_ID}] [upload-batch] completed ${results.length} success, ${errors.length} errors`)

  const csrfToken = generateCsrfToken()
  if (errors.length > 0 && results.length === 0) {
    throw new ApiError(500, `All uploads failed: ${errors.map((e) => `${e.fileName}: ${e.error}`).join('; ')}`)
  }

  res.status(errors.length > 0 ? 207 : 201).json({
    success: true,
    data: {
      urls: results,
      errors: errors.length > 0 ? errors : undefined,
      total,
      successCount: results.length,
      errorCount: errors.length,
      csrfToken,
    },
  })
}))

router.post('/delete', authenticate, validateCsrfToken, asyncHandler(async (req, res) => {
  const { publicId, resourceType } = req.body
  if (!publicId) {
    throw new ApiError(400, 'publicId is required')
  }
  if (resourceType === 'hyperserve') {
    res.status(410).json({ success: false, message: 'Media deletion is disabled to preserve existing assets' })
    return
  }
  res.status(410).json({ success: false, message: 'Media deletion is disabled to preserve existing assets' })
}))

export default router