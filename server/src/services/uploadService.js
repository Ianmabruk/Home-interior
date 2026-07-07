import streamifier from 'streamifier'
import cloudinary from '../config/cloudinary.js'
import { ApiError } from '../utils/ApiError.js'

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])
const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
])

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const classifyCloudinaryError = (error) => {
  const message = String(error?.message || error || '').toLowerCase()

  if (
    message.includes('invalid api key') ||
    message.includes('unknown api key') ||
    message.includes('authentication')
  ) {
    return 'Invalid Cloudinary credentials'
  }

  if (message.includes('timeout') || message.includes('timed out') || message.includes('econnreset')) {
    return 'Upload timed out. Please try again.'
  }

  if (
    message.includes('unsupported') ||
    message.includes('format') ||
    message.includes('type')
  ) {
    return 'Unsupported file format.'
  }

  if (message.includes('quota') || message.includes('limit') || message.includes('bandwidth')) {
    return 'Cloudinary quota exceeded.'
  }

  if (message.includes('file too large') || message.includes('too big')) {
    return 'File too large.'
  }

  return 'Cloudinary upload failed.'
}

const uploadOnce = (fileBuffer, folder, resourceType) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          reject(error)
          return
        }
        resolve(result)
      },
    )

    streamifier.createReadStream(fileBuffer).pipe(uploadStream)
  })

export const uploadToCloudinary = async (fileBuffer, folder, resourceType = 'image') => {
  if (!fileBuffer) {
    throw new ApiError(400, 'No file buffer provided')
  }

  const isVideo = resourceType === 'video'
  const allowedTypes = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES
  const maxSize = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES

  if (fileBuffer.length > maxSize) {
    throw new ApiError(
      413,
      `${isVideo ? 'Video' : 'Image'} exceeds ${Math.floor(maxSize / 1024 / 1024)}MB limit.`,
    )
  }

  const detectedType = isVideo ? 'video/mp4' : 'image/jpeg'
  if (!allowedTypes.has(detectedType)) {
      throw new ApiError(415, `Unsupported file type: ${detectedType}`)
  }

  let lastError
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await uploadOnce(fileBuffer, folder, resourceType)
      return result
    } catch (error) {
      lastError = error
      if (attempt < 2) {
        await sleep(500 * attempt)
      }
    }
  }

  const friendlyMessage = classifyCloudinaryError(lastError)
  console.error('Cloudinary upload error:', lastError)
  throw new ApiError(502, friendlyMessage)
}
