import { api } from './api'

const VERIFY_ATTEMPTS = 3

function normalizeUploadMetadata(result) {
  return {
    assetId: result.asset_id || result.assetId || null,
    publicId: result.public_id || result.publicId,
    resourceType: result.resource_type || result.resourceType || 'video',
    type: result.type || 'upload',
    secureUrl: result.secure_url || result.secureUrl,
    version: result.version ?? null,
    format: result.format || null,
    bytes: result.bytes ?? null,
    duration: result.duration ?? null,
    width: result.width ?? null,
    height: result.height ?? null,
  }
}

function getErrorStatus(error) {
  return error?.status || error?.response?.status
}

function shouldRetryVerification(error) {
  const status = getErrorStatus(error)
  const code = error?.code || error?.response?.data?.code
  if ([
    'CLOUDINARY_AUTHENTICATION_FAILED',
    'CLOUDINARY_NOT_CONFIGURED',
    'CLOUDINARY_ASSET_MISMATCH',
    'CLOUDINARY_PUBLIC_ID_MISMATCH',
    'CLOUDINARY_UPLOAD_METADATA_MISMATCH',
    'CLOUDINARY_VIDEO_NOT_PUBLIC',
    'CLOUDINARY_VIDEO_DELIVERY_UNAVAILABLE',
  ].includes(code)) return false
  if (code === 'CLOUDINARY_ASSET_NOT_FOUND' || code === 'CLOUDINARY_VIDEO_DELIVERY_NOT_READY') return true
  if (code === 'CLOUDINARY_VERIFY_TEMPORARY') return true
  return !status || status === 408 || status === 429 || status >= 500
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function verifyUploadedVideo(uploadMetadata) {
  const uploadedAsset = normalizeUploadMetadata(uploadMetadata)
  let lastError
  for (let attempt = 1; attempt <= VERIFY_ATTEMPTS; attempt += 1) {
    try {
      const response = await api.post('/admin/blog/cloudinary/verify', uploadedAsset)
      return normalizeUploadMetadata(response.data)
    } catch (error) {
      lastError = error
      if (attempt === VERIFY_ATTEMPTS || !shouldRetryVerification(error)) break
      await delay(400 * (2 ** (attempt - 1)))
    }
  }
  if (lastError && typeof lastError === 'object') {
    lastError.uploadedAsset = uploadedAsset
  }
  throw lastError
}

export async function uploadOptimizedVideo(file, contentHash, handlers = {}) {
  if (!file) throw new Error('No optimized video is available')
  const publicId = `hok-blog-${contentHash.slice(0, 32)}`
  const signature = await api.post('/admin/blog/cloudinary/signature', { publicId })
  const signed = signature.data
  const existingUrl = `https://res.cloudinary.com/${signed.cloudName}/video/upload/${signed.folder}/${signed.publicId}.mp4`

  try {
    const existing = await api.post('/admin/blog/cloudinary/verify', {
      publicId,
      resourceType: 'video',
      type: 'upload',
      secureUrl: existingUrl,
    })
    handlers.onUploadProgress?.(100)
    return normalizeUploadMetadata(existing.data)
  } catch (error) {
    if (getErrorStatus(error) !== 404) throw error
  }

  const uploadResponse = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    handlers.setCancel?.(() => xhr.abort())
    const form = new FormData()
    form.append('file', file, 'optimized.mp4')
    form.append('api_key', signed.apiKey)
    form.append('timestamp', String(signed.timestamp))
    form.append('signature', signed.signature)
    form.append('folder', signed.folder)
    form.append('public_id', signed.publicId)
    form.append('overwrite', 'false')

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${signed.cloudName}/video/upload`)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        handlers.onUploadProgress?.(Math.round((event.loaded * 100) / event.total))
      }
    }
    xhr.onerror = () => reject(new Error('Cloudinary upload was interrupted. Check your connection and retry.'))
    xhr.onabort = () => reject(new Error('Video upload cancelled'))
    xhr.onload = () => {
      let result
      try {
        result = JSON.parse(xhr.responseText)
      } catch {
        reject(new Error('Cloudinary returned an invalid upload response'))
        return
      }
      if (
        xhr.status < 200
        || xhr.status >= 300
        || result.resource_type !== 'video'
        || result.type !== 'upload'
        || !result.secure_url
        || !result.public_id
      ) {
        reject(new Error(result.error?.message || `Cloudinary upload failed with status ${xhr.status}`))
        return
      }
      resolve(result)
    }
    xhr.send(form)
  })

  const uploadedAsset = normalizeUploadMetadata(uploadResponse)
  try {
    return await verifyUploadedVideo(uploadedAsset)
  } catch (error) {
    if (error && typeof error === 'object') error.uploadedAsset = uploadedAsset
    throw error
  }
}
