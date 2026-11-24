import { api } from './api'

const HYPERSERVE_MAX_BYTES = 5 * 1024 * 1024 * 1024
const HYPERSERVE_STATUS_INTERVAL_MS = 2000
const HYPERSERVE_STATUS_ATTEMPTS = 120

function isVideoFile(file) {
  return file?.type?.startsWith('video/')
    || /\.(mp4|mov|m4v|webm|avi|mkv|3gp|ogv|ogg)$/i.test(file?.name || '')
}

function makeUploadError(message, status) {
  const error = new Error(message)
  error.status = status
  return error
}

function putVideoToStorage({ uploadUrl, contentType, file, onProgress, setCancel }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let settled = false
    const finish = (callback, value) => {
      if (settled) return
      settled = true
      callback(value)
    }
    xhr.open('PUT', uploadUrl)
    xhr.timeout = 30 * 60 * 1000
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      onProgress?.(Math.min(99, Math.round(event.loaded * 100 / event.total)))
    }
    xhr.onerror = () => finish(reject, makeUploadError(
      'Hyperserve upload was interrupted. Check your connection and retry.',
      xhr.status || 0,
    ))
    xhr.ontimeout = () => finish(reject, makeUploadError('Hyperserve upload timed out. Retry the video upload.', 504))
    xhr.onabort = () => finish(reject, new Error('Video upload cancelled'))
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        finish(reject, makeUploadError(
          `Hyperserve upload failed with status ${xhr.status}`,
          xhr.status,
        ))
        return
      }
      finish(resolve, true)
    }
    setCancel?.(() => xhr.abort())
    xhr.send(file)
  })
}

export const mediaService = {
  async upload(file, folder = 'hok-interiors', transformation = {}, uploadId = null, handlers = {}) {
    if (isVideoFile(file)) {
      if (!file.size || file.size > HYPERSERVE_MAX_BYTES) {
        throw new Error(file.size > HYPERSERVE_MAX_BYTES
          ? 'Video exceeds Hyperserve\'s 5 GB limit'
          : 'Video file is empty')
      }
      const filename = file.name || handlers.originalName || `video-${Date.now()}.mp4`
      handlers.onPhase?.('preparing')
      const createResponse = await api.post('/media/hyperserve/create', {
        filename,
        fileSize: file.size,
        mimeType: file.type || 'video/mp4',
        resolutions: ['480p', '720p', '1080p'],
        isPublic: true,
        thumbnailTimestampsSeconds: [1],
        customMetadata: { folder, originalFilename: filename },
      })
      const upload = createResponse.data?.data
      if (!upload?.id || !upload?.uploadUrl || !upload?.contentType) {
        throw new Error('Hyperserve did not return valid upload authorization')
      }

      handlers.onPhase?.('uploading')
      await putVideoToStorage({
        uploadUrl: upload.uploadUrl,
        contentType: upload.contentType,
        file,
        onProgress: handlers.onUploadProgress,
        setCancel: handlers.setCancel,
      })
      handlers.onUploadProgress?.(100)

      handlers.onPhase?.('processing')
      const completeResponse = await api.post(`/media/hyperserve/${encodeURIComponent(upload.id)}/complete`)
      const complete = completeResponse.data?.data
      let statusResult = complete

      for (let attempt = 0; attempt < HYPERSERVE_STATUS_ATTEMPTS; attempt += 1) {
        if (statusResult?.status === 'ready') break
        if (statusResult?.status === 'fail') throw new Error('Hyperserve video processing failed')
        if (attempt > 0) {
          const statusResponse = await api.get(`/media/hyperserve/${encodeURIComponent(upload.id)}/status`)
          statusResult = statusResponse.data?.data
        }
        if (statusResult?.status !== 'ready' && statusResult?.status !== 'fail') {
          await new Promise((resolve) => setTimeout(resolve, HYPERSERVE_STATUS_INTERVAL_MS))
        }
      }

      if (statusResult?.status !== 'ready') {
        throw new Error(statusResult?.status === 'fail'
          ? 'Hyperserve video processing failed'
          : 'Hyperserve is still processing the video')
      }

      const resolutions = statusResult.resolutions || {}
      const resolution = resolutions['1080p']?.status === 'ready'
        ? resolutions['1080p']
        : resolutions['720p']?.status === 'ready'
          ? resolutions['720p']
          : resolutions['480p']?.status === 'ready'
            ? resolutions['480p']
            : Object.values(resolutions).find((entry) => entry?.status === 'ready')
      const playbackUrl = resolution?.videoUrl
      if (!playbackUrl) throw new Error('Hyperserve returned no playback URL')

      handlers.onPhase?.('saving')
      return {
        providerAssetId: upload.id,
        publicId: upload.id,
        assetId: upload.id,
        resourceType: 'video',
        storageProvider: 'hyperserve',
        mediaType: 'video',
        secureUrl: playbackUrl,
        playbackUrl,
        thumbnailUrl: resolution?.thumbnailImageUrls?.[0] || null,
        originalName: file.name,
        originalFilename: file.name,
        fileSize: file.size,
        bytes: file.size,
        originalBytes: file.size,
        mimeType: file.type || 'video/mp4',
        format: 'mp4',
        uploadStatus: 'ready',
        duration: null,
        width: null,
        height: null,
      }
    }

    const formData = new FormData()
    formData.append('media', file)
    formData.append('folder', folder)
    if (uploadId) formData.append('uploadId', uploadId)
    if (Object.keys(transformation).length > 0) {
      formData.append('transformation', JSON.stringify(transformation))
    }
    const res = await api.post('/media/upload', formData)
    return res.data.data
  },

  async uploadPreparedVideo(file, folder, originalMetadata, contentHash, handlers = {}) {
    return this.upload(file, folder, {}, null, handlers)
  },

  async uploadMultiple(files, folder = 'hok-interiors') {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('folder', folder)
    const res = await api.post('/media/upload-batch', formData)
    return res.data
  },

  async delete(publicId, resourceType = 'cloudinary') {
    if (resourceType === 'hyperserve') {
      const res = await api.post('/media/delete', { publicId, resourceType: 'hyperserve' })
      return res.data
    }
    const res = await api.post('/media/delete', { publicId, resourceType })
    return res.data
  },

  async getList(folder = 'hok-interiors', maxResults = 100) {
    const res = await api.get('/media', { params: { folder, maxResults } })
    return res.data
  },

  getOptimizedUrl(publicId, options = {}) {
    if (!publicId) return null
    const { width, height, crop = 'limit', quality = 'auto', format = 'auto' } = options
    const transformations = []
    if (width) transformations.push(`w_${width}`)
    if (height) transformations.push(`h_${height}`)
    if (crop) transformations.push(`c_${crop}`)
    if (quality) transformations.push(`q_${quality}`)
    if (format) transformations.push(`f_${format}`)
    const transformString = transformations.join(',')
    return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/${transformString}/${publicId}`
  },

  getSrcSet(publicId, widths = [400, 800, 1200, 1600, 1920]) {
    if (!publicId) return ''
    return widths
      .map((w) => `${this.getOptimizedUrl(publicId, { width: w })} ${w}w`)
      .join(', ')
  },
}

export default mediaService