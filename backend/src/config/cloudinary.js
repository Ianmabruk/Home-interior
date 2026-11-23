import { v2 as cloudinary } from 'cloudinary'
import { failure } from '../utils/response.js'

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

export const isCloudinaryConfigured = () => Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)
const isConfigured = isCloudinaryConfigured()

export function assertCloudinaryConfigured() {
  if (!isConfigured) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.')
  }
}

// Allow enough time for 100 MB media uploads on slower connections.
const CLOUDINARY_UPLOAD_TIMEOUT_MS = 300000
// Number of retry attempts for transient Cloudinary failures (network errors,
// timeouts, 5xx responses). A stable public_id makes retries idempotent.
const CLOUDINARY_MAX_RETRIES = 2
const CLOUDINARY_RETRY_BASE_DELAY_MS = 2000

// Video containers browsers can be handed directly. Anything else (.mov, .avi,
// .mkv, .webm, .ogv …) is stored as-is but only ever delivered through the
// eager MP4 derivative below.
const VIDEO_EXTENSIONS = new Set([
  'mp4', 'm4v', 'mov', 'webm', 'ogv', 'ogg', 'avi', 'mkv', 'mpeg', 'mpg', '3gp', '3g2', 'm2ts', 'mts',
])

// The single delivery format for every uploaded video: MP4 / H.264 / AAC /
// yuv420p. This is the combination iOS Safari, Chrome and Firefox all decode
// without a fallback source. `eager` makes Cloudinary build it during the
// upload call, so playback never waits on a first-request transcode.
const WEB_VIDEO_EAGER = {
  format: 'mp4',
  video_codec: { codec: 'h264', profile: 'baseline', level: '3.1' },
  audio_codec: 'aac',
  pixel_format: 'yuv420p',
  bit_rate: '4m',
}

const getFileExtension = (name) => {
  if (typeof name !== 'string') return ''
  const clean = name.split('?')[0].split('#')[0]
  const idx = clean.lastIndexOf('.')
  return idx === -1 ? '' : clean.slice(idx + 1).toLowerCase()
}

// A file is a video if the browser said so, or if the name says so. The
// multipart MIME is client-supplied and browsers frequently report
// `application/octet-stream` for .mov/.mkv, which previously made these
// uploads fall through to resource_type "auto" and land in the wrong bucket.
export const isVideoFile = (mimetype, originalName) => {
  if (typeof mimetype === 'string' && mimetype.toLowerCase().startsWith('video/')) return true
  return VIDEO_EXTENSIONS.has(getFileExtension(originalName))
}

// Rebuild the eager web-playback URL from a stored public id. Used at delivery
// time so existing rows keep working without a migration or re-upload.
export const getWebPlayableVideoUrl = (publicId, { cloudName = CLOUDINARY_CLOUD_NAME, width } = {}) => {
  if (!publicId || !cloudName) return null
  const parts = []
  if (width) parts.push(`w_${width}`, 'c_limit')
  parts.push('f_mp4', 'vc_h264', 'ac_aac')
  return `https://res.cloudinary.com/${cloudName}/video/upload/${parts.join(',')}/${publicId}.mp4`
}

if (isConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableCloudinaryError(err) {
  if (!err) return false
  // Cloudinary SDK errors have http_code property
  const httpCode = err?.http_code
  if (httpCode && httpCode >= 500) return true
  // Network/timeout errors
  if (err?.message?.includes('timed out')) return true
  if (err?.message?.includes('ECONNRESET')) return true
  if (err?.message?.includes('ETIMEDOUT')) return true
  if (err?.name === 'TypeError') return true
  return false
}

export const uploadToCloudinary = async (buffer, mimetype, folder, originalName, uploadId = null) => {
  if (!isConfigured) {
    assertCloudinaryConfigured()
  }

  const isVideoUpload = isVideoFile(mimetype, originalName)
  const publicId = uploadId || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  let lastError = null
  for (let attempt = 0; attempt <= CLOUDINARY_MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = CLOUDINARY_RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
      console.log(`[Cloudinary] Retrying upload (attempt ${attempt + 1}/${CLOUDINARY_MAX_RETRIES + 1}) after ${delay}ms`)
      await sleep(delay)
    }

    try {
      const uploadOptions = {
        resource_type: isVideoUpload ? 'video' : (mimetype?.startsWith('image/') ? 'image' : 'raw'),
        folder,
        public_id: publicId,
        overwrite: true,
        quality: 'auto:good',
      }

      if (isVideoUpload) {
        // Always bucket videos explicitly. Relying on "auto" mis-filed
        // client-reported octet-streams as images, producing a permanently
        // unplayable record.
        uploadOptions.resource_type = 'video'
        // Build the browser-compatible MP4 now, while we still hold the
        // upload request open. Delivering an un-transformed URL instead would
        // push a transcode onto the first viewer, and mobile Safari abandons
        // that slow first request — the cause of the phone-only failures.
        // The original asset is left untouched next to this derivative.
        uploadOptions.eager = [WEB_VIDEO_EAGER]
        uploadOptions.eager_async = false
      }

      const result = await new Promise((resolve, reject) => {
        let settled = false
        const timer = setTimeout(() => {
          if (settled) return
          settled = true
          reject(new Error('Cloudinary upload timed out after 120000ms'))
        }, CLOUDINARY_UPLOAD_TIMEOUT_MS)
        const stream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (settled) return
            clearTimeout(timer)
            if (error) {
              console.error('[Cloudinary] Upload stream error:', {
                message: error.message,
                http_code: error.http_code,
                name: error.name,
              })
              reject(error)
            } else {
              resolve(result)
            }
          },
        ).end(buffer)
      })

      if (!result?.secure_url) {
        throw new Error('Cloudinary upload did not return a secure media URL')
      }

      let playableUrl = result.secure_url
      let playableFormat = result.format || null

      if (isVideoUpload) {
        if (result.resource_type !== 'video') {
          throw new Error(`Cloudinary stored the video as ${result.resource_type || 'an unknown resource type'}`)
        }
        // Prefer the eager H.264/AAC/MP4 derivative. It is already generated,
        // so playback is an immediate CDN hit instead of an on-demand transcode.
        const eagerEntry = Array.isArray(result.eager) ? result.eager[0] : null
        if (!eagerEntry?.secure_url || (eagerEntry.format && eagerEntry.format !== 'mp4')) {
          throw failure(
            422,
            "Cloudinary couldn't create the compatible H.264/AAC MP4 playback file. Try a smaller H.264/AAC MP4 video below the current plan's video-transformation limit.",
          )
        }
        playableUrl = eagerEntry.secure_url
        playableFormat = eagerEntry.format || 'mp4'
      }

      const duration = Number(result.duration)
      return {
        // `url` is what the public site plays. `originalUrl` keeps the untouched
        // source asset addressable for re-processing later.
        url: playableUrl,
        originalUrl: result.secure_url,
        assetId: result.asset_id || null,
        publicId: result.public_id,
        mimeType: mimetype,
        originalName: originalName || null,
        resourceType: result.resource_type || null,
        type: result.type || 'upload',
        version: result.version != null && Number.isFinite(Number(result.version))
          ? Number(result.version)
          : null,
        format: playableFormat,
        originalFormat: result.format || null,
        duration: Number.isFinite(duration) ? duration : null,
        width: Number.isFinite(Number(result.width)) ? Number(result.width) : null,
        height: Number.isFinite(Number(result.height)) ? Number(result.height) : null,
        bytes: Number.isFinite(Number(result.bytes)) ? Number(result.bytes) : null,
      }
    } catch (err) {
      lastError = err
      console.error('[Cloudinary] Upload failed:', {
        message: err?.message,
        http_code: err?.http_code,
        name: err?.name,
        folder,
        mimetype,
        bufferLength: buffer?.length || buffer?.byteLength || 'unknown',
        attempt,
      })

      if (attempt >= CLOUDINARY_MAX_RETRIES || !isRetryableCloudinaryError(err)) {
        throw err
      }
    }
  }

  throw lastError
}

export const deleteFromCloudinary = async (publicId, resourceType = 'auto') => {
  if (!publicId || !isConfigured) return
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
  } catch (error) {
    console.error('Cloudinary delete error:', error)
  }
}

export const deleteManyFromCloudinary = async (publicIds) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) return
  await Promise.allSettled(publicIds.map(deleteFromCloudinary))
}

export function createSignedVideoUpload(publicId) {
  assertCloudinaryConfigured()
  if (!publicId) throw failure(400, 'publicId is required')
  const folder = 'hok-interiors/blog-videos'
  return createSignedVideoUploadForFolder(publicId, folder)
}

export function createSignedVideoUploadForFolder(publicId, folder) {
  assertCloudinaryConfigured()
  if (!publicId) throw failure(400, 'publicId is required')
  if (!['hok-interiors/blog-videos', 'virtual-designs'].includes(folder)) {
    throw failure(400, 'Invalid Cloudinary video folder')
  }
  const timestamp = Math.floor(Date.now() / 1000)
  const params = { timestamp, folder, public_id: publicId, overwrite: true }
  const signature = cloudinary.utils.api_sign_request(
    params,
    CLOUDINARY_API_SECRET,
  )
  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    signature,
    timestamp,
    folder,
    publicId,
    params,
  }
}

const CLOUDINARY_VIDEO_FOLDER = 'hok-interiors/blog-videos'
const CLOUDINARY_VERIFY_MAX_ATTEMPTS = 3

function redactCloudinaryDiagnostic(value) {
  let text = String(value || '')
  for (const secret of [CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]) {
    if (secret) text = text.split(secret).join('[redacted]')
  }
  return text.replace(/(api_key|api_secret|signature|token)=([^&\s]+)/gi, '$1=[redacted]')
}

function cloudinaryCauseDetails(error, depth = 0) {
  if (!error || depth >= 4) return null
  return {
    name: redactCloudinaryDiagnostic(error?.name || 'Error'),
    message: redactCloudinaryDiagnostic(error?.message || 'Unknown Cloudinary error'),
    code: redactCloudinaryDiagnostic(error?.code || error?.errno || ''),
    syscall: redactCloudinaryDiagnostic(error?.syscall || ''),
    hostname: redactCloudinaryDiagnostic(error?.hostname || ''),
    cause: cloudinaryCauseDetails(error?.cause, depth + 1),
  }
}

function cloudinaryErrorDetails(error) {
  return {
    name: redactCloudinaryDiagnostic(error?.name || 'Error'),
    message: redactCloudinaryDiagnostic(error?.message || 'Unknown Cloudinary error'),
    code: redactCloudinaryDiagnostic(error?.code || error?.errno || ''),
    httpCode: error?.http_code ?? error?.statusCode ?? null,
    syscall: redactCloudinaryDiagnostic(error?.syscall || ''),
    hostname: redactCloudinaryDiagnostic(error?.hostname || ''),
    cause: cloudinaryCauseDetails(error?.cause),
    stack: redactCloudinaryDiagnostic(error?.stack || ''),
  }
}

function isTransientAdminApiError(error) {
  const httpCode = Number(error?.http_code || error?.statusCode)
  if (httpCode === 429 || httpCode >= 500) return true
  const codes = [
    error?.code,
    error?.errno,
    error?.cause?.code,
    error?.cause?.errno,
  ].filter(Boolean)
  const errorText = [error?.message, error?.cause?.message].filter(Boolean).join(' ')
  return error?.name === 'TypeError'
    || error?.name === 'AbortError'
    || codes.some((code) => /^(ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|ECONNREFUSED|ECONNABORTED|EPIPE|UND_ERR_CONNECT_TIMEOUT|UND_ERR_HEADERS_TIMEOUT|UND_ERR_BODY_TIMEOUT|UND_ERR_SOCKET)$/i.test(code))
    || /ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|ECONNREFUSED|ECONNABORTED|UND_ERR_(?:CONNECT|HEADERS|BODY)_TIMEOUT|socket hang up/i.test(errorText)
}

function extractPublicIdFromVideoUrl(deliveryUrl) {
  const prefix = `/${CLOUDINARY_CLOUD_NAME}/video/upload/`
  if (!deliveryUrl.pathname.startsWith(prefix)) return null
  const rawPath = deliveryUrl.pathname.slice(prefix.length)
  const versionMatch = rawPath.match(/^v(\d+)\//)
  const path = rawPath.replace(/^v\d+\//, '')
  let decodedPath
  try {
    decodedPath = path.split('/').map((part) => decodeURIComponent(part)).join('/')
  } catch {
    return null
  }
  const finalSlash = decodedPath.lastIndexOf('/')
  const fileName = decodedPath.slice(finalSlash + 1)
  const extensionIndex = fileName.lastIndexOf('.')
  if (extensionIndex < 1) return null
  const extension = fileName.slice(extensionIndex + 1).toLowerCase()
  if (!VIDEO_EXTENSIONS.has(extension)) return null
  const fileStem = fileName.slice(0, extensionIndex)
  return {
    publicId: finalSlash === -1 ? fileStem : `${decodedPath.slice(0, finalSlash)}/${fileStem}`,
    extension,
    version: versionMatch ? Number(versionMatch[1]) : null,
  }
}

function validateCloudinaryVideoResource(resource, { assetId, publicId }) {
  if (
    !resource
    || resource.resource_type !== 'video'
    || resource.type !== 'upload'
    || resource.public_id !== publicId
    || (assetId && resource.asset_id && resource.asset_id !== assetId)
  ) {
    throw failure(422, 'Cloudinary returned metadata that does not match the uploaded video', 'CLOUDINARY_ASSET_MISMATCH')
  }
  return resource
}

async function lookupCloudinaryVideo({ assetId, publicId }) {
  let lastError = null
  if (assetId) {
    try {
      const resource = await cloudinary.api.resource_by_asset_id(assetId)
      return validateCloudinaryVideoResource(resource, { assetId, publicId })
    } catch (error) {
      if (error?.status === 422 && error?.code === 'CLOUDINARY_ASSET_MISMATCH') throw error
      lastError = error
      console.error('[Cloudinary] Admin API asset-ID lookup failed; falling back to video public_id', {
        lookup: 'asset_id',
        assetId,
        error: cloudinaryErrorDetails(error),
      })
    }
  }

  for (let attempt = 1; attempt <= CLOUDINARY_VERIFY_MAX_ATTEMPTS; attempt++) {
    try {
      const resource = await cloudinary.api.resource(publicId, {
        resource_type: 'video',
        type: 'upload',
      })
      return validateCloudinaryVideoResource(resource, { assetId, publicId })
    } catch (error) {
      if (error?.status === 422 && error?.code === 'CLOUDINARY_ASSET_MISMATCH') throw error
      lastError = error
      console.error('[Cloudinary] Admin API video public_id lookup failed', {
        lookup: 'public_id',
        resourceType: 'video',
        deliveryType: 'upload',
        attempt,
        error: cloudinaryErrorDetails(error),
      })
      if (attempt === CLOUDINARY_VERIFY_MAX_ATTEMPTS || !isTransientAdminApiError(error)) break
      await sleep(250 * (2 ** (attempt - 1)))
    }
  }

  const httpCode = Number(lastError?.http_code || lastError?.statusCode)
  if (httpCode === 404) {
    throw failure(404, 'Cloudinary video upload was not found', 'CLOUDINARY_ASSET_NOT_FOUND')
  }
  if (httpCode === 401 || httpCode === 403) {
    throw failure(503, 'Cloudinary rejected the Admin API credentials or account configuration', 'CLOUDINARY_AUTHENTICATION_FAILED')
  }
  if (httpCode === 429 || httpCode >= 500 || isTransientAdminApiError(lastError)) {
    throw failure(503, 'Cloudinary verification is temporarily unavailable. Retry verification without uploading again.', 'CLOUDINARY_VERIFY_TEMPORARY')
  }
  throw failure(503, 'Cloudinary could not verify the uploaded video', 'CLOUDINARY_VERIFY_FAILED')
}

async function checkCloudinaryVideoDelivery(secureUrl) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 2500)
  try {
    let response = await fetch(secureUrl, { method: 'HEAD', signal: controller.signal })
    if (response.status === 405 || response.status === 501) {
      response = await fetch(secureUrl, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        signal: controller.signal,
      })
      await response.body?.cancel()
    }
    const delivery = {
      accessible: response.ok || response.status === 206,
      status: response.status,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
      acceptRanges: response.headers.get('accept-ranges'),
      cloudinaryError: response.headers.get('x-cld-error'),
    }
    if (!delivery.accessible) {
      console.warn('[Cloudinary] Secondary video delivery check returned an HTTP failure', {
        status: delivery.status,
        contentType: delivery.contentType,
        contentLength: delivery.contentLength,
        acceptRanges: delivery.acceptRanges,
        cloudinaryError: redactCloudinaryDiagnostic(delivery.cloudinaryError || ''),
      })
    }
    return delivery
  } catch (error) {
    console.warn('[Cloudinary] Secondary video delivery check could not complete', {
      error: cloudinaryErrorDetails(error),
    })
    return { accessible: null, status: null }
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function verifyCloudinaryVideo({
  assetId,
  publicId,
  resourceType,
  type,
  secureUrl,
  version,
  format,
  bytes,
}) {
  if (!isConfigured) {
    throw failure(503, 'Cloudinary is not configured', 'CLOUDINARY_NOT_CONFIGURED')
  }
  if (
    typeof publicId !== 'string'
    || !/^[a-zA-Z0-9_/-]{8,220}$/.test(publicId)
    || typeof secureUrl !== 'string'
    || (resourceType != null && resourceType !== 'video')
    || (type != null && type !== 'upload')
    || (assetId != null && (typeof assetId !== 'string' || assetId.length > 200))
    || (version != null && (!Number.isInteger(Number(version)) || Number(version) < 1))
    || (format != null && (typeof format !== 'string' || !/^[a-zA-Z0-9]{2,8}$/.test(format)))
    || (bytes != null && (!Number.isFinite(Number(bytes)) || Number(bytes) < 0))
  ) {
    throw failure(400, 'Valid Cloudinary video metadata and secure_url are required', 'INVALID_CLOUDINARY_VIDEO_METADATA')
  }
  let deliveryUrl
  try {
    deliveryUrl = new URL(secureUrl)
  } catch {
    throw failure(422, 'The uploaded asset is not a valid Cloudinary video URL')
  }
  if (
    deliveryUrl.protocol !== 'https:'
    || deliveryUrl.hostname !== 'res.cloudinary.com'
    || deliveryUrl.port
    || deliveryUrl.search
    || deliveryUrl.hash
  ) {
    throw failure(422, 'The uploaded asset is not a secure Cloudinary video URL', 'INVALID_CLOUDINARY_VIDEO_URL')
  }

  const urlMetadata = extractPublicIdFromVideoUrl(deliveryUrl)
  const expectedPublicId = urlMetadata?.publicId
  if (!expectedPublicId || !expectedPublicId.startsWith(`${CLOUDINARY_VIDEO_FOLDER}/`)) {
    throw failure(422, 'The uploaded asset URL is not in the signed video upload folder', 'INVALID_CLOUDINARY_VIDEO_URL')
  }
  const requestedPublicIdMatches = publicId === expectedPublicId
    || (!publicId.includes('/') && expectedPublicId.endsWith(`/${publicId}`))
  if (!requestedPublicIdMatches) {
    throw failure(422, 'The video URL does not match the signed Cloudinary public_id', 'CLOUDINARY_PUBLIC_ID_MISMATCH')
  }
  if (
    (version != null && Number(version) !== urlMetadata.version)
    || (format != null && format.toLowerCase() !== urlMetadata.extension)
  ) {
    throw failure(422, 'The uploaded video metadata does not match its secure URL', 'CLOUDINARY_UPLOAD_METADATA_MISMATCH')
  }

  const resource = await lookupCloudinaryVideo({
    assetId: assetId || undefined,
    publicId: expectedPublicId,
  })
  if (resource.access_mode && resource.access_mode !== 'public') {
    throw failure(422, 'The Cloudinary video exists but is not configured for public delivery', 'CLOUDINARY_VIDEO_NOT_PUBLIC')
  }
  let verifiedSecureUrl = secureUrl
  if (resource.secure_url) {
    let resourceUrl
    try {
      resourceUrl = new URL(resource.secure_url)
    } catch {
      throw failure(422, 'Cloudinary returned an invalid video delivery URL', 'CLOUDINARY_ASSET_MISMATCH')
    }
    const resourceUrlMetadata = extractPublicIdFromVideoUrl(resourceUrl)
    if (
      resourceUrl.protocol !== 'https:'
      || resourceUrl.hostname !== 'res.cloudinary.com'
      || resourceUrlMetadata?.publicId !== resource.public_id
      || (resource.version != null && resourceUrlMetadata.version !== Number(resource.version))
    ) {
      throw failure(422, 'Cloudinary returned video delivery metadata for a different asset', 'CLOUDINARY_ASSET_MISMATCH')
    }
    verifiedSecureUrl = resource.secure_url
  }
  if (
    (version != null && Number(version) !== Number(resource.version))
    || (format != null && format.toLowerCase() !== String(resource.format || '').toLowerCase())
    || (bytes != null && Number(bytes) !== Number(resource.bytes))
  ) {
    throw failure(422, 'Cloudinary asset metadata does not match the completed upload response', 'CLOUDINARY_UPLOAD_METADATA_MISMATCH')
  }
  const metadataNumber = (value) => (
    value != null && Number.isFinite(Number(value)) ? Number(value) : null
  )
  const delivery = await checkCloudinaryVideoDelivery(verifiedSecureUrl)
  if (delivery.accessible === false) {
    if (delivery.status === 404) {
      throw failure(503, 'The video exists in Cloudinary but is not available from its delivery URL yet. Retry verification.', 'CLOUDINARY_VIDEO_DELIVERY_NOT_READY')
    }
    if (delivery.status === 429 || delivery.status >= 500) {
      throw failure(503, 'Cloudinary video delivery is temporarily unavailable. Retry verification.', 'CLOUDINARY_VERIFY_TEMPORARY')
    }
    if (delivery.status === 401 || delivery.status === 403) {
      throw failure(422, 'The Cloudinary video exists but its delivery URL is restricted', 'CLOUDINARY_VIDEO_NOT_PUBLIC')
    }
    throw failure(503, 'The Cloudinary video exists, but its delivery URL returned an unexpected response', 'CLOUDINARY_VIDEO_DELIVERY_UNAVAILABLE')
  }
  return {
    assetId: resource.asset_id || assetId || null,
    secureUrl: verifiedSecureUrl,
    publicId: resource.public_id,
    resourceType: 'video',
    type: resource.type || 'upload',
    version: metadataNumber(resource.version),
    format: resource.format || urlMetadata.extension,
    duration: metadataNumber(resource.duration),
    width: metadataNumber(resource.width),
    height: metadataNumber(resource.height),
    bytes: metadataNumber(resource.bytes),
    deliveryAccessible: delivery.accessible,
    deliveryStatus: delivery.status,
    deliveryContentType: delivery.contentType || null,
    deliveryContentLength: delivery.contentLength || null,
    deliveryAcceptRanges: delivery.acceptRanges || null,
  }
}

export default cloudinary
