import multer from 'multer'
import { ApiError } from '../utils/ApiError.js'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
const MAX_FILE_SIZE = 50 * 1024 * 1024
const MAX_FILES = 20

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov']

const storage = multer.memoryStorage()

function isAllowedFile(file, allowedTypes, allowedExts) {
  if (allowedTypes.includes(file.mimetype)) return true
  if (file.mimetype === 'application/octet-stream' && file.originalname) {
    const ext = '.' + file.originalname.split('.').pop().toLowerCase()
    return allowedExts.includes(ext)
  }
  return false
}

export const uploadSingle = (field = 'media', allowedTypes = ALLOWED_IMAGE_TYPES) => {
  const allowedExts = allowedTypes
    ? allowedTypes.map((t) => ALLOWED_IMAGE_EXTENSIONS.find((e) => t.includes(e.replace('.', ''))))
    : ALLOWED_IMAGE_EXTENSIONS
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
      if (isAllowedFile(file, allowedTypes, allowedExts)) return cb(null, true)
      cb(new ApiError(400, `Invalid file type: ${file.mimetype}`))
    },
  }).single(field)
}

export const uploadFields = (fields) => {
  const allExts = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS]
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
    fileFilter: (req, file, cb) => {
      if (isAllowedFile(file, [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES], allExts)) {
        return cb(null, true)
      }
      cb(new ApiError(400, `Invalid file type: ${file.mimetype}`))
    },
  }).fields(fields)
}

export const uploadArray = (field = 'media', maxCount = MAX_FILES) => {
  const allExts = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS]
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE, files: maxCount },
    fileFilter: (req, file, cb) => {
      if (isAllowedFile(file, [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES], allExts)) {
        return cb(null, true)
      }
      cb(new ApiError(400, `Invalid file type: ${file.mimetype}`))
    },
  }).array(field, maxCount)
}

export const uploadProductImages = (maxCount = 60) => {
  const allExts = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS]
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE, files: maxCount },
    fileFilter: (req, file, cb) => {
      if (isAllowedFile(file, [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES], allExts)) {
        return cb(null, true)
      }
      cb(new ApiError(400, `Invalid file type: ${file.mimetype}`))
    },
  }).any()
}

export const uploadProductImagesStrict = (maxCount = 60) => {
  const allExts = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS]
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE, files: maxCount },
    fileFilter: (req, file, cb) => {
      if (!isAllowedFile(file, [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES], allExts)) {
        return cb(new ApiError(400, `Invalid file type: ${file.mimetype}`))
      }
      const allowed = /^(images|variantImages(_|\[)\d+)$/
      if (!allowed.test(file.fieldname)) {
        return cb(new ApiError(400, `Invalid field name: ${file.fieldname}`))
      }
      cb(null, true)
    },
  }).any()
}
