import { api } from './api'

export async function uploadOptimizedVideo(file, contentHash, handlers = {}) {
  if (!file) throw new Error('No optimized video is available')
  const publicId = `hok-blog-${contentHash.slice(0, 32)}`
  const signature = await api.post('/admin/blog/cloudinary/signature', { publicId })
  const signed = signature.data
  const existingUrl = `https://res.cloudinary.com/${signed.cloudName}/video/upload/${signed.folder}/${signed.publicId}.mp4`

  try {
    const existing = await api.post('/admin/blog/cloudinary/verify', {
      publicId,
      secureUrl: existingUrl,
    })
    handlers.onUploadProgress?.(100)
    return {
      secureUrl: existing.data.secureUrl,
      publicId: existing.data.publicId,
      resourceType: 'video',
      format: existing.data.format || 'mp4',
      duration: existing.data.duration,
      width: existing.data.width,
      height: existing.data.height,
      bytes: existing.data.bytes,
    }
  } catch (error) {
    if (error?.status !== 404 && error?.response?.status !== 404) throw error
  }

  const secureUrl = await new Promise((resolve, reject) => {
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
      if (xhr.status < 200 || xhr.status >= 300 || result.resource_type !== 'video' || !result.secure_url || !result.public_id) {
        reject(new Error(result.error?.message || `Cloudinary upload failed with status ${xhr.status}`))
        return
      }
      resolve(result.secure_url)
    }
    xhr.send(form)
  })

  const verified = await api.post('/admin/blog/cloudinary/verify', {
    publicId,
    secureUrl,
  })

  return {
    secureUrl: verified.data.secureUrl,
    publicId: verified.data.publicId,
    resourceType: 'video',
    format: verified.data.format || 'mp4',
    duration: verified.data.duration,
    width: verified.data.width,
    height: verified.data.height,
    bytes: verified.data.bytes,
  }
}
