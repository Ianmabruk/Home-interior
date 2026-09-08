const CLOUDINARY_IMAGE_SEGMENT = '/image/upload/'
const CLOUDINARY_VIDEO_SEGMENT = '/video/upload/'

const buildTransformString = (options = {}) => {
  // Default to device-pixel-ratio auto so Cloudinary serves appropriately
  // sized images on high-DPI mobile devices unless explicitly overridden.
  const { width, height, dpr = 'auto', crop, quality = 'auto', format = 'auto' } = options
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
  if (!isCloudinaryImage(url)) return typeof url === 'string' ? url : null
  const transform = buildTransformString(options)
  if (!transform) return url
  return url.replace(CLOUDINARY_IMAGE_SEGMENT, `${CLOUDINARY_IMAGE_SEGMENT}${transform}/`)
}

// Returns an optimized URL that requests device pixel ratio aware image
// (dpr_auto). Use for LCP/hero images so Cloudinary serves the right size
// for high-DPI mobile screens automatically.
export const getOptimizedUrlAutoDpr = (url, options = {}) => {
  return getOptimizedUrl(url, { ...options, dpr: options.dpr || 'auto' })
}

// Return a tiny placeholder URL (small width) suitable for blur-up or LQIP.
// This intentionally returns a Cloudinary URL (small, low-byte) rather than
// an inline base64 to avoid build-time processing. Caller can use it as a
// background-image while the full image loads.
export const getPlaceholderUrl = (url, options = {}) => {
  if (!isCloudinaryImage(url)) return typeof url === 'string' ? url : null
  const opts = { width: options.width || 40, crop: options.crop || 'limit', quality: 'auto', format: 'auto' }
  return getOptimizedUrl(url, opts)
}

export const RESPONSIVE_WIDTHS = [320, 480, 640, 960, 1280]

export const buildSrcSet = (url, widths = RESPONSIVE_WIDTHS) => {
  if (!isCloudinaryImage(url) || typeof url !== 'string') return ''
  return widths
    .map((w) => `${getOptimizedUrl(url, { width: w, crop: 'limit' })} ${w}w`)
    .join(', ')
}

export const getOptimizedVideoUrl = (url, options = {}) => {
  if (!isCloudinaryVideo(url) || typeof url !== 'string') return typeof url === 'string' ? url : null
  const { width, quality = 'auto', format = 'auto' } = options
  const parts = []
  if (width) parts.push(`w_${width}`, 'c_limit')
  parts.push(`q_${quality}`, `f_${format}`)
  return url.replace(CLOUDINARY_VIDEO_SEGMENT, `${CLOUDINARY_VIDEO_SEGMENT}${parts.join(',')}/`)
}

export const getVideoPosterUrl = (url, options = {}) => {
  if (!isCloudinaryVideo(url) || typeof url !== 'string') return undefined
  const { width = 1280 } = options
  const transformed = url.replace(
    CLOUDINARY_VIDEO_SEGMENT,
    `${CLOUDINARY_VIDEO_SEGMENT}so_0,w_${width},c_limit,q_auto,f_auto/`,
  )
  return transformed.replace(/\.(mp4|webm|mov|m4v|avi)(\?.*)?$/i, '.jpg$2')
}

export default getOptimizedUrl