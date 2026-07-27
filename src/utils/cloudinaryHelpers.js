const CLOUDINARY_IMAGE_SEGMENT = '/image/upload/'
const CLOUDINARY_VIDEO_SEGMENT = '/video/upload/'

const buildTransformString = (options = {}) => {
  const { width, height, dpr, crop, quality = 'auto', format = 'auto' } = options
  const parts = []
  if (width) parts.push(`w_${width}`)
  if (height) parts.push(`h_${height}`)
  if (dpr) parts.push(`dpr_${dpr}`)
  if (crop) parts.push(`c_${crop}`)
  parts.push(`q_${quality}`)
  parts.push(`f_${format}`)
  return parts.join(',')
}

const isCloudinaryImage = (url) =>
  typeof url === 'string' && url.includes(CLOUDINARY_IMAGE_SEGMENT)

const isCloudinaryVideo = (url) =>
  typeof url === 'string' && url.includes(CLOUDINARY_VIDEO_SEGMENT)

export const getOptimizedUrl = (url, options = {}) => {
  if (!isCloudinaryImage(url)) return url
  const transform = buildTransformString(options)
  if (!transform) return url
  return url.replace(CLOUDINARY_IMAGE_SEGMENT, `${CLOUDINARY_IMAGE_SEGMENT}${transform}/`)
}

export const RESPONSIVE_WIDTHS = [320, 480, 640, 960, 1280]

export const buildSrcSet = (url, widths = RESPONSIVE_WIDTHS) => {
  if (!isCloudinaryImage(url)) return ''
  return widths
    .map((w) => `${getOptimizedUrl(url, { width: w, crop: 'limit' })} ${w}w`)
    .join(', ')
}

export const getOptimizedVideoUrl = (url, options = {}) => {
  if (!isCloudinaryVideo(url)) return url
  const { width, quality = 'auto', format = 'auto' } = options
  const parts = []
  if (width) parts.push(`w_${width}`, 'c_limit')
  parts.push(`q_${quality}`, `f_${format}`)
  return url.replace(CLOUDINARY_VIDEO_SEGMENT, `${CLOUDINARY_VIDEO_SEGMENT}${parts.join(',')}/`)
}

export const getVideoPosterUrl = (url, options = {}) => {
  if (!isCloudinaryVideo(url)) return undefined
  const { width = 1280 } = options
  const transformed = url.replace(
    CLOUDINARY_VIDEO_SEGMENT,
    `${CLOUDINARY_VIDEO_SEGMENT}so_0,w_${width},c_limit,q_auto,f_auto/`,
  )
  return transformed.replace(/\.(mp4|webm|mov|m4v|avi)(\?.*)?$/i, '.jpg$2')
}

export default getOptimizedUrl