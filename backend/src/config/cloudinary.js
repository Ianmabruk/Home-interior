import { v2 as cloudinary } from 'cloudinary'

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

const isConfigured = Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)

// Cloudinary upload timeout. Large portfolio images (>10MB after compression)
// can take 60-90 seconds to upload on slower connections. 120s provides a
// comfortable margin while still failing fast enough to surface errors.
const CLOUDINARY_UPLOAD_TIMEOUT_MS = 120000
// Number of retry attempts for transient Cloudinary failures (network errors,
// timeouts, 5xx responses). Retries use a new public_id each time to avoid
// duplicate uploads.
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
  // Cloudinary SDK errors have http_code property
  const httpCode = err?.http_code
  if (httpCode && httpCode >= 500) return true
  // Network/timeout errors
  if (err?.message?.includes('timed out')) return true
  if (err?.message?.includes('ECONNRESET')) return true
  if (err?.message?.includes('ETIMEDOUT')) return true
  if (err?.name === 'TypeError') return true
  return false
}

export const uploadToCloudinary = async (buffer, mimetype, folder, originalName) => {
  if (!isConfigured) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.')
  }

  const isVideoUpload = Boolean(mimetype && mimetype.startsWith('video/'))
  let lastError = null
  for (let attempt = 0; attempt <= CLOUDINARY_MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = CLOUDINARY_RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
      console.log(`[Cloudinary] Retrying upload (attempt ${attempt + 1}/${CLOUDINARY_MAX_RETRIES + 1}) after ${delay}ms`)
      await sleep(delay)
    }

    try {
      const publicId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

      const uploadOptions = {
        resource_type: 'auto',
        folder,
        public_id: publicId,
        overwrite: false,
        quality: 'auto:good',
      }

      if (isVideoUpload) {
        uploadOptions.resource_type = 'video'
        uploadOptions.transformation = [
          { format: 'mp4', video_codec: 'h264', audio_codec: 'aac' },
        ]
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

      if (isVideoUpload) {
        if (result.resource_type !== 'video') {
          throw new Error(`Cloudinary stored the video as ${result.resource_type || 'an unknown resource type'}`)
        }
        if (result.format && result.format !== 'mp4') {
          throw new Error(`Cloudinary returned an unsupported video format: ${result.format}`)
        }
      }

      const duration = Number(result.duration)
      return {
        url: result.secure_url,
        publicId: result.public_id,
        mimeType: mimetype,
        originalName: originalName || null,
        resourceType: result.resource_type || null,
        format: result.format || null,
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

export const deleteFromCloudinary = async (publicId, resourceType = 'auto') => {
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
