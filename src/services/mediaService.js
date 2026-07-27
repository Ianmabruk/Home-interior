import { api } from './api'

export const mediaService = {
  async upload(file, folder = 'hok-interiors', transformation = {}) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    if (Object.keys(transformation).length > 0) {
      formData.append('transformation', JSON.stringify(transformation))
    }
    const res = await api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  async uploadMultiple(files, folder = 'hok-interiors') {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('folder', folder)
    const res = await api.post('/media/upload-multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  async delete(publicId) {
    const res = await api.delete(`/media/${publicId}`)
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