import { api } from './api'

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

export async function uploadOptimizedVideo(file, contentHash, handlers = {}) {
  if (!file) throw new Error('No optimized video is available')
  const publicId = `hok-blog-${contentHash.slice(0, 32)}`
  const signature = await api.post('/admin/blog/cloudinary/signature', { publicId })
  const signed = signature.data

  const uploadOnce = () => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const timeoutId = setTimeout(() => xhr.abort(), 300000)
    handlers.setCancel?.(() => xhr.abort())
    const form = new FormData()
    form.append('file', file, 'optimized.mp4')
    form.append('api_key', signed.apiKey)
    form.append('timestamp', String(signed.timestamp))
    form.append('signature', signed.signature)
    form.append('folder', signed.folder)
    form.append('public_id', signed.publicId)
    form.append('overwrite', 'true')

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${signed.cloudName}/video/upload`)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        handlers.onUploadProgress?.(Math.round((event.loaded * 100) / event.total))
      }
    }
    xhr.onerror = () => {
      clearTimeout(timeoutId)
      const error = new Error('Cloudinary upload was interrupted. Check your connection and retry.')
      error.status = 0
      reject(error)
    }
    xhr.ontimeout = () => {
      clearTimeout(timeoutId)
      const error = new Error('Cloudinary upload timed out. Retry the video upload.')
      error.status = 504
      reject(error)
    }
    xhr.onabort = () => {
      clearTimeout(timeoutId)
      reject(new Error('Video upload cancelled'))
    }
    xhr.onload = () => {
      clearTimeout(timeoutId)
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
        const error = new Error(result.error?.message || `Cloudinary upload failed with status ${xhr.status}`)
        error.status = xhr.status
        reject(error)
        return
      }
      resolve(result)
    }
    xhr.timeout = 300000
    xhr.send(form)
  })

  let lastError
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const uploadResponse = await uploadOnce()
      handlers.onUploadProgress?.(100)
      return normalizeUploadMetadata(uploadResponse)
    } catch (error) {
      lastError = error
      const status = error?.status
      if (attempt === 1 || status === 400 || status === 401 || status === 403 || status === 404) break
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }
  throw lastError
}
