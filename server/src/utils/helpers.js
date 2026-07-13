import { ApiError } from './ApiError.js'

// Null-safe: several controllers (e.g. homepageFeed) pass the result of
// findFirst() which can be `null`. The previous `{ ...item, _id: item.id }`
// threw "Cannot read properties of null" and 500'd the whole response (the
// homepage feed in particular). Returning null through keeps the contract
// `{ data: null }` that callers already handle.
export const withId = (item) => (item == null ? item : { ...item, _id: item.id })
export const withIdArray = (items) => (Array.isArray(items) ? items : []).map((item) => withId(item))

export const parseMaybeJson = (value, fallback = null) => {
  if (typeof value !== 'string') return fallback
  try { return JSON.parse(value) } catch { return fallback }
}

export const DEFAULT_MEDIA_SETTINGS = { position: 'center', zoom: 100, fit: 'cover' }

export const ALLOWED_POSITIONS = new Set([
  'center', 'top', 'bottom', 'left', 'right',
  'top-left', 'top-right', 'bottom-left', 'bottom-right',
])

export const ALLOWED_FITS = new Set(['contain', 'cover', 'fill', 'scale-down'])

export const ALLOWED_ZOOMS = new Set([50, 75, 100, 125, 150])

export const parseMediaSettings = (value) => {
  const parsed = typeof value === 'string'
    ? parseMaybeJson(value, null)
    : (value && typeof value === 'object' ? value : null)
  if (!parsed || typeof parsed !== 'object') return null

  const position = ALLOWED_POSITIONS.has(parsed.position) ? parsed.position : DEFAULT_MEDIA_SETTINGS.position
  const fit = ALLOWED_FITS.has(parsed.fit) ? parsed.fit : DEFAULT_MEDIA_SETTINGS.fit
  const zoomNumber = Number(parsed.zoom)
  const zoom = ALLOWED_ZOOMS.has(zoomNumber) ? zoomNumber : DEFAULT_MEDIA_SETTINGS.zoom

  return { position, zoom, fit }
}

export const parseBody = (schema, body) => {
  const result = schema.safeParse(body)
  if (!result.success) {
    const issues = result.error.issues || []
    const message = issues.map((e) => {
      const path = Array.isArray(e.path) && e.path.length ? `${e.path.join('.')}: ` : ''
      return `${path}${e.message}`
    }).join(', ') || 'Validation error'
    throw new ApiError(400, message, issues)
  }
  return result.data
}
