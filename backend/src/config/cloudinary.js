import { v2 as cloudinary } from 'cloudinary'
import { failure } from '../utils/response.js'

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

export const isCloudinaryConfigured = () => Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)
const isConfigured = isCloudinaryConfigured()

export function assertCloudinaryConfigured() {
  if (!isConfigured) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.')
  }
}

const CLOUDINARY_UPLOAD_TIMEOUT_MS = 300000
const CLOUDINARY_MAX_RETRIES = 2
const CLOUDINARY_RETRY_BASE_DELAY_MS = 2000

if (isConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableCloudinaryError(err) {
  if (!err) return false
  const httpCode = err?.http_code
  if (httpCode && httpCode >= 500) return true
  if (err?.message?.includes('timed out')) return true
  if (err?.message?.includes('ECONNRESET')) return true
  if (err?.message?.includes('ETIMEDOUT')) return true
  if (err?.name === 'TypeError') return true
  return false
}

export const uploadToCloudinary = async (buffer, mimetype, folder, originalName, uploadId = null) => {
  if (!isConfigured) {
    assertCloudinaryConfigured()
  }

  if (!mimetype?.startsWith('image/')) {
    throw failure(400, 'Cloudinary upload only accepts image files. Use Hyperserve for videos.')
  }

  const publicId = uploadId || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  let lastError = null
  for (let attempt = 0; attempt <= CLOUDINARY_MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = CLOUDINARY_RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
      console.log(`[Cloudinary] Retrying upload (attempt ${attempt + 1}/${CLOUDINARY_MAX_RETRIES + 1}) after ${delay}ms`)
      await sleep(delay)
    }

    try {
      const uploadOptions = {
        resource_type: 'image',
        folder,
        public_id: publicId,
        overwrite: true,
        quality: 'auto:good',
      }

      const result = await new Promise((resolve, reject) => {
        let settled = false
        const timer = setTimeout(() => {
          if (settled) return
          settled = true
          reject(new Error('Cloudinary upload timed out after 120000ms'))
        }, CLOUDINARY_UPLOAD_TIMEOUT_MS)
        const stream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (settled) return
            clearTimeout(timer)
            if (error) {
              console.error('[Cloudinary] Upload stream error:', {
                message: error.message,
                http_code: error.http_code,
                name: error.name,
              })
              reject(error)
            } else {
              resolve(result)
            }
          },
        ).end(buffer)
      })

      if (!result?.secure_url) {
        throw new Error('Cloudinary upload did not return a secure media URL')
      }

      const duration = Number(result.duration)
      return {
        url: result.secure_url,
        originalUrl: result.secure_url,
        assetId: result.asset_id || null,
        publicId: result.public_id,
        mimeType: mimetype,
        originalName: originalName || null,
        resourceType: result.resource_type || 'image',
        type: result.type || 'upload',
        version: result.version != null && Number.isFinite(Number(result.version))
          ? Number(result.version)
          : null,
        format: result.format || null,
        originalFormat: result.format || null,
        duration: Number.isFinite(duration) ? duration : null,
        width: Number.isFinite(Number(result.width)) ? Number(result.width) : null,
        height: Number.isFinite(Number(result.height)) ? Number(result.height) : null,
        bytes: Number.isFinite(Number(result.bytes)) ? Number(result.bytes) : null,
      }
    } catch (err) {
      lastError = err
      console.error('[Cloudinary] Upload failed:', {
        message: err?.message,
        http_code: err?.http_code,
        name: err?.name,
        folder,
        mimetype,
        bufferLength: buffer?.length || buffer?.byteLength || 'unknown',
        attempt,
      })

      if (attempt >= CLOUDINARY_MAX_RETRIES || !isRetryableCloudinaryError(err)) {
        throw err
      }
    }
  }

  throw lastError
}

export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId || !isConfigured) return
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
  } catch (error) {
    console.error('Cloudinary delete error:', error)
  }
}

export const deleteManyFromCloudinary = async (publicIds) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) return
  await Promise.allSettled(publicIds.map(deleteFromCloudinary))
}

export default cloudinary