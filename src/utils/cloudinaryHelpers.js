const CLOUDINARY_IMAGE_SEGMENT = '/image/upload/'
const CLOUDINARY_VIDEO_SEGMENT = '/video/upload/'

// A Cloudinary URL that already ends in .mp4 is served straight from the CDN.
// Appending vc_h264 there would ask Cloudinary to build a derived asset on the
// first viewer's request; that request blocks while the transcode runs, and
// mobile Safari abandons it (MEDIA_ERR_NETWORK) long before desktop finishes.
const isDirectMp4 = (url) => /\.mp4(\?|#|$)/i.test(String(url).split('/').pop() || '')

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

export { isCloudinaryVideo }

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
  if (typeof url !== 'string') return null
  if (!url) return url
  if (!isCloudinaryVideo(url)) return url
  // Already an MP4 (every upload since the eager-derivative fix, plus any
  // legacy asset that was stored as MP4): serve it untouched.
  if (isDirectMp4(url)) return url
  // Legacy non-MP4 assets (.mov/.webm/.avi/.mkv …) still need a real transcode.
  // Re-encoding on demand is unavoidable for these, so keep the request minimal
  // and let the browser retry the now-cached derivative.
  const { width } = options
  const parts = []
  if (width) parts.push(`w_${width}`, 'c_limit')
  parts.push('f_mp4', 'vc_h264', 'ac_aac')
  return url.replace(CLOUDINARY_VIDEO_SEGMENT, `${CLOUDINARY_VIDEO_SEGMENT}${parts.join(',')}/`)
}

// The MIME type to advertise on a <source>. Browsers skip a source whose
// declared type they cannot handle, so this must reflect the real file rather
// than assuming MP4.
export const getVideoSourceType = (url) => {
  if (typeof url !== 'string' || !url) return undefined
  if (isCloudinaryVideo(url)) return 'video/mp4'
  const extension = url.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase()
  const types = {
    mp4: 'video/mp4',
    m4v: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    ogv: 'video/ogg',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    mpeg: 'video/mpeg',
    mpg: 'video/mpeg',
    '3gp': 'video/3gpp',
    '3g2': 'video/3gpp2',
  }
  return types[extension]
}

// Poster frame for a Cloudinary video. Cloudinary derives this from the stored
// asset, so it never depends on autoplay succeeding. If derivation fails the
// <video> simply falls back to its own first frame — the poster must never be
// what breaks playback.
export const getVideoPosterUrl = (url, options = {}) => {
  if (typeof url !== 'string' || !url) return undefined
  if (!isCloudinaryVideo(url)) return undefined
  const { width = 1280 } = options
  const transformed = url.replace(
    CLOUDINARY_VIDEO_SEGMENT,
    `${CLOUDINARY_VIDEO_SEGMENT}so_0,w_${width},c_limit,q_auto,f_jpg/`,
  )
  const base = transformed.split('/').pop() || ''
  const withoutQuery = base.split('?')[0].split('#')[0]
  const stem = withoutQuery.replace(/\.[^.]+$/, '')
  if (!stem) return undefined
  return `${transformed.slice(0, transformed.length - base.length)}${stem}.jpg`
}

export default getOptimizedUrl