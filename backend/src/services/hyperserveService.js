const DEFAULT_BASE_URL = 'https://api.hyperserve.io/api'
const HYPERSERVE_MAX_BYTES = 5 * 1024 * 1024 * 1024
const HYPERSERVE_TIMEOUT_MS = 30000

function getConfig() {
  const apiKey = process.env.HYPERSERVE_API_KEY
  if (!apiKey) {
    const error = new Error('Hyperserve is not configured')
    error.status = 503
    throw error
  }
  const baseUrl = (process.env.HYPERSERVE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '')
  return { apiKey, baseUrl }
}

async function request(method, path, body) {
  const { apiKey, baseUrl } = getConfig()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), HYPERSERVE_TIMEOUT_MS)
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'X-API-KEY': apiKey,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    })
    const text = await response.text()
    let data = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = null
      }
    }
    if (!response.ok) {
      const error = new Error(data?.message || `Hyperserve request failed (${response.status})`)
      error.status = response.status
      error.code = data?.code
      throw error
    }
    return data
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error('Hyperserve request timed out')
      timeoutError.status = 504
      throw timeoutError
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export function validateHyperserveVideo(file) {
  const name = file?.originalname || file?.name || ''
  const mimeType = file?.mimetype || file?.type || ''
  const size = Number(file?.size)
  const extension = name.includes('.') ? `.${name.split('.').pop().toLowerCase()}` : ''
  const allowedExtensions = [
    '.mp4', '.m4v', '.mov', '.avi', '.mkv', '.webm', '.flv',
    '.wmv', '.mpeg', '.mpg', '.mts', '.m2ts', '.mxf',
  ]
  const allowedMimeTypes = [
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
    'video/webm', 'video/x-flv', 'video/x-ms-wmv', 'video/mpeg',
    'video/mp2t', 'application/octet-stream',
  ]
  if (!name || (!allowedExtensions.includes(extension) && !allowedMimeTypes.includes(mimeType))) {
    throw Object.assign(new Error('Unsupported video format'), { status: 400 })
  }
  if (!Number.isFinite(size) || size <= 0) {
    throw Object.assign(new Error('Video file is empty'), { status: 400 })
  }
  if (size > HYPERSERVE_MAX_BYTES) {
    throw Object.assign(new Error("Video exceeds Hyperserve's 5 GB limit"), { status: 413 })
  }
  return { name, size, mimeType }
}

export async function createHyperserveVideo({ filename, resolutions = ['480p', '720p', '1080p'], isPublic = true, thumbnailTimestampsSeconds, customMetadata }) {
  return request('POST', '/video', {
    filename,
    resolutions,
    isPublic,
    ...(thumbnailTimestampsSeconds ? { thumbnailTimestampsSeconds } : {}),
    ...(customMetadata ? { customMetadata } : {}),
  })
}

export async function completeHyperserveUpload(id) {
  return request('POST', `/video/${encodeURIComponent(id)}/complete-upload`)
}

export async function getHyperserveVideo(id, isPublic = true) {
  const path = isPublic
    ? `/video/${encodeURIComponent(id)}/public`
    : `/video/${encodeURIComponent(id)}/private/3600`
  return request('GET', path)
}

export async function deleteHyperserveVideo(id) {
  // Provider assets are never deleted automatically.
  return { success: true, preserved: true }
}
