import multer from 'multer'
import { ApiError } from '../utils/ApiError.js'
import { MAX_FILE_SIZE_BYTES } from '../constants/upload.js'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const MAX_FILES = 1000

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']

const storage = multer.memoryStorage()

function isAllowedFile(file, allowedTypes, allowedExts) {
  if (allowedTypes.includes(file.mimetype)) return true
  if (file.mimetype === 'application/octet-stream' && file.originalname) {
    const ext = '.' + file.originalname.split('.').pop().toLowerCase()
    return allowedExts.includes(ext)
  }
  return false
}

function getAllowedExtensionsForTypes(allowedTypes) {
  return allowedTypes.flatMap((type) => {
    if (type === 'image/jpeg') return ['.jpg', '.jpeg']
    return `.${type.split('/')[1]}`
  })
}

export const uploadSingle = (field = 'media', allowedTypes = ALLOWED_IMAGE_TYPES) => {
  const allowedExts = allowedTypes ? getAllowedExtensionsForTypes(allowedTypes) : ALLOWED_IMAGE_EXTENSIONS
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (req, file, cb) => {
      if (isAllowedFile(file, allowedTypes, allowedExts)) return cb(null, true)
      cb(new ApiError(400, `Invalid file type: ${file.mimetype}`))
    },
  }).single(field)
}

export const uploadFields = (fields) => {
  const perFieldTypes = new Map(fields.map((f) => [f.name, ALLOWED_IMAGE_TYPES]))
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_FILES },
    fileFilter: (req, file, cb) => {
      const allowedTypes = perFieldTypes.get(file.fieldname) || ALLOWED_IMAGE_TYPES
      const allowedExts = getAllowedExtensionsForTypes(allowedTypes)
      if (isAllowedFile(file, allowedTypes, allowedExts)) {
        return cb(null, true)
      }
      cb(new ApiError(400, `Invalid file type for "${file.fieldname}": ${file.mimetype}. Only images are accepted.`))
    },
  }).fields(fields)
}

export const uploadArray = (field = 'media', maxCount = MAX_FILES, allowedTypes = ALLOWED_IMAGE_TYPES) => {
  const allowedExts = getAllowedExtensionsForTypes(allowedTypes)
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES, files: maxCount },
    fileFilter: (req, file, cb) => {
      if (isAllowedFile(file, allowedTypes, allowedExts)) {
        return cb(null, true)
      }
      cb(new ApiError(400, `Invalid file type: ${file.mimetype}. Only images are accepted.`))
    },
  }).array(field, maxCount)
}

export const uploadProductImages = (maxCount = 60) => {
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES, files: maxCount },
    fileFilter: (req, file, cb) => {
      if (isAllowedFile(file, ALLOWED_IMAGE_TYPES, ALLOWED_IMAGE_EXTENSIONS)) {
        return cb(null, true)
      }
      cb(new ApiError(400, `Invalid file type: ${file.mimetype}. Only images are accepted.`))
    },
  }).any()
}

export const uploadProductImagesStrict = (maxCount = 60) => {
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES, files: maxCount },
    fileFilter: (req, file, cb) => {
      if (!isAllowedFile(file, ALLOWED_IMAGE_TYPES, ALLOWED_IMAGE_EXTENSIONS)) {
        return cb(new ApiError(400, `Invalid file type: ${file.mimetype}. Only images are accepted.`))
      }
      const fn = file.fieldname
      const isValidField = fn === 'images' || /^variantImages[_(\[]\d+/.test(fn)
      if (!isValidField) {
        return cb(new ApiError(400, `Invalid field name: ${file.fieldname}`))
      }
      cb(null, true)
    },
  }).any()
}