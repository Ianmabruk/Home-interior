import { api } from './api'

const CLOUDINARY_MAX_BYTES = 100 * 1024 * 1024

function isVideoFile(file) {
  return file?.type?.startsWith('video/')
    || /\.(mp4|mov|m4v|webm|avi|mkv|3gp|ogv|ogg)$/i.test(file?.name || '')
}

export const mediaService = {
  async upload(file, folder = 'hok-interiors', transformation = {}, uploadId = null, handlers = {}) {
    if (isVideoFile(file)) {
      if (!file.size || file.size > CLOUDINARY_MAX_BYTES) {
        throw new Error(file.size > CLOUDINARY_MAX_BYTES
          ? 'Video exceeds the 100 MB limit'
          : 'Video file is empty')
      }
      handlers.onPhase?.('preparing')
      const filename = file.name || handlers.originalName || `video-${Date.now()}.mp4`
      const uploadResponse = await api.post('/media/video/upload', {
        filename,
        fileSize: file.size,
        mimeType: file.type || 'video/mp4',
        folder,
        uploadId,
      })
      const upload = uploadResponse.data?.data
      if (!upload?.url || !upload?.publicId) {
        throw new Error('Video upload did not return valid upload details')
      }

      handlers.onPhase?.('uploading')
      handlers.onUploadProgress?.(100)

      handlers.onPhase?.('processing')

      handlers.onPhase?.('saving')
      return {
        providerAssetId: upload.publicId,
        publicId: upload.publicId,
        assetId: upload.assetId || upload.publicId,
        resourceType: 'video',
        storageProvider: 'cloudinary',
        mediaType: 'video',
        secureUrl: upload.secureUrl || upload.url,
        playbackUrl: upload.secureUrl || upload.url,
        thumbnailUrl: upload.thumbnailUrl || null,
        originalName: file.name,
        originalFilename: file.name,
        fileSize: file.size,
        bytes: file.size,
        originalBytes: file.size,
        mimeType: file.type || 'video/mp4',
        format: upload.format || 'mp4',
        uploadStatus: 'ready',
        duration: upload.duration ?? null,
        width: upload.width ?? null,
        height: upload.height ?? null,
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