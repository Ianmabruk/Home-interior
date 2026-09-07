const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Timeouts — generous for cold-start recovery on Render free tier
const REGULAR_TIMEOUT = 45000   // 45s (was 30s) — covers Render cold-start (~30s)
const ORDER_TIMEOUT = 120000
const UPLOAD_TIMEOUT = 180000   // 3 min for large uploads

function getRequestTimeout(url) {
  if (url.includes('/orders')) return ORDER_TIMEOUT
  if (url.includes('/upload') || url.includes('/media') || url.includes('/shop') || url.includes('/portfolio') || url.includes('/virtual-design') || url.includes('/hero-image') || url.includes('/blog') || url.includes('/services') || url.includes('/testimonial') || url.includes('/about') || url.includes('/circular-tab') || url.includes('/work-with-us')) return UPLOAD_TIMEOUT
  return REGULAR_TIMEOUT
}

function joinUrl(base, path) {
  if (!path) return base
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/')) return base + path
  return `${base}/${path}`
}

const CONTENT_PATHS = [
  '/homepage',
  '/portfolio',
  '/virtual-design',
  '/services',
  '/about',
  '/hero-media',
  '/consultations',
  '/media',
  '/test-upload',
  '/work-with-us',
]

function rewriteContentPath(url) {
  for (const prefix of CONTENT_PATHS) {
    if (url === prefix || url.startsWith(prefix + '/')) {
      return '/content' + url
    }
  }
  return url
}

function getAuthHeader() {
  const token = localStorage.getItem('hok_access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function getCsrfHeader() {
  if (!csrfToken) {
    try {
      csrfToken = localStorage.getItem('hok_csrf_token')
    } catch {
      // ignore
    }
  }
  return csrfToken ? { 'x-csrf-token': csrfToken } : {}
}

function combineSignals(a, b) {
  if (!b) return a
  const combined = new AbortController()
  const handler = () => combined.abort()
  if (a.aborted) handler()
  else a.addEventListener('abort', handler)
  if (b.aborted) handler()
  else b.addEventListener('abort', handler)
  return combined.signal
}

// ─── Token refresh ────────────────────────────────────────────────────────────
// Single in-flight refresh promise so concurrent 401s only trigger one refresh.
let refreshPromise = null
let refreshFailed = false

async function attemptTokenRefresh() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      const response = await fetch(joinUrl(API_BASE_URL, '/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        refreshFailed = true
        localStorage.removeItem('hok_access_token')
        try { localStorage.removeItem('hok_csrf_token') } catch { /* ignore */ }
        csrfToken = null
        window.dispatchEvent(new CustomEvent('hok-auth-failed'))
        throw new Error('Refresh failed')
      }

      const data = await response.json()
      const accessToken = data?.data?.accessToken
      if (!accessToken) {
        refreshFailed = true
        localStorage.removeItem('hok_access_token')
        window.dispatchEvent(new CustomEvent('hok-auth-failed'))
        throw new Error('No access token in refresh response')
      }

      localStorage.setItem('hok_access_token', accessToken)
      if (data?.data?.csrfToken) {
        setStoredCsrfToken(data.data.csrfToken)
      }
      refreshFailed = false
      return accessToken
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// ─── CSRF ─────────────────────────────────────────────────────────────────────
let csrfToken = null
// Track when the CSRF token was last refreshed so we can proactively renew it
// before the 1-hour server-side TTL expires.
let csrfTokenSetAt = 0
const CSRF_REFRESH_INTERVAL = 50 * 60 * 1000 // 50 minutes (server TTL is 60 min)

function setStoredCsrfToken(token) {
  csrfToken = token
  csrfTokenSetAt = Date.now()
  try {
    localStorage.setItem('hok_csrf_token', token)
    localStorage.setItem('hok_csrf_token_at', String(csrfTokenSetAt))
  } catch {
    // ignore
  }
}

function loadStoredCsrfToken() {
  if (csrfToken) return
  try {
    const stored = localStorage.getItem('hok_csrf_token')
    const storedAt = Number(localStorage.getItem('hok_csrf_token_at') || '0')
    if (stored && storedAt && Date.now() - storedAt < CSRF_REFRESH_INTERVAL) {
      csrfToken = stored
      csrfTokenSetAt = storedAt
    } else if (stored) {
      // Token exists but may be stale — clear it so we fetch a fresh one
      localStorage.removeItem('hok_csrf_token')
      localStorage.removeItem('hok_csrf_token_at')
    }
  } catch {
    // ignore
  }
}

// Proactively refresh the CSRF token before it expires on the server.
async function ensureFreshCsrfToken() {
  loadStoredCsrfToken()
  const token = localStorage.getItem('hok_access_token')
  if (!token) return // Not authenticated — no CSRF needed

  const age = Date.now() - csrfTokenSetAt
  if (csrfToken && age < CSRF_REFRESH_INTERVAL) return // Still fresh

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    const response = await fetch(joinUrl(API_BASE_URL, '/auth/csrf'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (response.ok) {
      const data = await response.json()
      if (data?.data?.csrfToken) {
        setStoredCsrfToken(data.data.csrfToken)
      }
    }
  } catch {
    // Non-fatal — the old token may still work
  }
}

// ─── In-memory GET cache ───────────────────────────────────────────────────────
const requestCache = new Map()
const CACHE_TTL = 5 * 60 * 1000

function cleanExpiredCacheEntries() {
  const now = Date.now()
  for (const [key, entry] of requestCache) {
    if (now - entry.timestamp > CACHE_TTL) {
      requestCache.delete(key)
    }
  }
}

setInterval(cleanExpiredCacheEntries, 60 * 1000)

// ─── Retry logic ──────────────────────────────────────────────────────────────
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])
const MAX_RETRIES = 2
const BASE_DELAY = 1000

function getRetryDelay(attempt) {
  return Math.min(BASE_DELAY * Math.pow(2, attempt), 8000)
}

async function withRetry(fn, signal) {
  let lastError
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt >= MAX_RETRIES) break
      if (signal?.aborted) break
      const status = err?.response?.status || err?.status
      if (!RETRYABLE_STATUS.has(status) && status !== undefined) break
      if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') break
      if (err?.name === 'TypeError' && !status) break
      await new Promise((r) => setTimeout(r, getRetryDelay(attempt)))
    }
  }
  throw lastError
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function doFetch(method, url, { headers = {}, body, signal, credentials = 'include' } = {}) {
  const controller = new AbortController()
  const timeout = getRequestTimeout(url)
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  const combinedSignal = signal ? combineSignals(controller.signal, signal) : controller.signal

  try {
    const response = await fetch(joinUrl(API_BASE_URL, url), {
      method,
      headers,
      body,
      signal: combinedSignal,
      credentials,
    })
    clearTimeout(timeoutId)
    return response
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      const canceled = new Error('Request canceled')
      canceled.name = 'CanceledError'
      canceled.code = 'ERR_CANCELED'
      throw canceled
    }
    throw err
  }
}

async function parseResponse(response, url, method) {
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data = isJson ? await response.json() : undefined

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && data.message) ||
      data ||
      response.statusText ||
      'Request failed'
    const error = new Error(message)
    error.status = response.status
    error.response = { status: response.status, data }
    throw error
  }

  if (data && typeof data === 'object' && 'success' in data && data.success === true) {
    const result = { data: data.data ?? null, status: response.status, headers: response.headers, config: { url, method } }
    if (data.meta) result.meta = data.meta
    if (data.data?.csrfToken) setStoredCsrfToken(data.data.csrfToken)
    return result
  }

  if (data?.csrfToken) setStoredCsrfToken(data.csrfToken)
  return { data, status: response.status, headers: response.headers, config: { url, method } }
}

// ─── Authenticated request with auto-refresh ──────────────────────────────────
async function authenticatedRequest(method, url, { headers = {}, body, signal } = {}) {
  const authHeaders = { ...getAuthHeader(), ...getCsrfHeader(), ...headers }

  let response = await doFetch(method, url, { headers: authHeaders, body, signal })

  // If 401 and we have a token, attempt refresh and retry once
  if (response.status === 401 && localStorage.getItem('hok_access_token') && !refreshFailed) {
    try {
      const newToken = await attemptTokenRefresh()
      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${newToken}`,
        ...getCsrfHeader(),
      }
      response = await doFetch(method, url, { headers: retryHeaders, body, signal })
    } catch {
      // Refresh failed — fall through to parse the 401 response
    }
  }

  // If 403 (CSRF expired), refresh CSRF token and retry once
  if (response.status === 403) {
    await ensureFreshCsrfToken()
    const retryHeaders = { ...getAuthHeader(), ...getCsrfHeader(), ...headers }
    response = await doFetch(method, url, { headers: retryHeaders, body, signal })
  }

  return parseResponse(response, url, method)
}

// ─── Public API object ────────────────────────────────────────────────────────
const api = {
  get(url, config = {}) {
    const rewritten = rewriteContentPath(url)
    const cacheKey = `get:${rewritten}:${JSON.stringify(config?.params || {})}`
    const cached = requestCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Promise.resolve({
        data: cached.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: rewritten, method: 'get' },
      })
    }

    const params = config.params
      ? '?' +
        Object.entries(config.params)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&')
      : ''

    const fullUrl = `${rewritten}${params}`

    return withRetry(
      () => {
        const headers = { ...getAuthHeader(), ...getCsrfHeader(), ...(config.headers || {}) }
        return doFetch('GET', fullUrl, { headers, signal: config.signal })
          .then(async (response) => {
            // 401 with token → refresh and retry
            if (response.status === 401 && localStorage.getItem('hok_access_token') && !refreshFailed) {
              try {
                const newToken = await attemptTokenRefresh()
                const retryHeaders = { Authorization: `Bearer ${newToken}`, ...getCsrfHeader(), ...(config.headers || {}) }
                response = await doFetch('GET', fullUrl, { headers: retryHeaders, signal: config.signal })
              } catch {
                // fall through
              }
            }
            return parseResponse(response, rewritten, 'get')
          })
          .then((result) => {
            // Only cache successful responses with actual data (not null/undefined)
            if (result.data !== null && result.data !== undefined) {
              requestCache.set(cacheKey, { data: result.data, timestamp: Date.now() })
            }
            return result
          })
      },
      config.signal,
    )
  },

  post(url, data, config = {}) {
    const rewritten = rewriteContentPath(url)
    const isFormData = data instanceof FormData
    const headers = {
      // Do NOT set Content-Type for FormData — browser sets it with boundary
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...getAuthHeader(),
      ...getCsrfHeader(),
      ...(config.headers || {}),
    }
    const body = isFormData ? data : (data !== undefined ? JSON.stringify(data) : undefined)

    return authenticatedRequest('POST', rewritten, { headers, body, signal: config.signal })
      .then((result) => {
        clearApiCache()
        return result
      })
  },

  put(url, data, config = {}) {
    const rewritten = rewriteContentPath(url)
    const isFormData = data instanceof FormData
    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...getAuthHeader(),
      ...getCsrfHeader(),
      ...(config.headers || {}),
    }
    const body = isFormData ? data : (data !== undefined ? JSON.stringify(data) : undefined)

    return authenticatedRequest('PUT', rewritten, { headers, body, signal: config.signal })
      .then((result) => {
        clearApiCache()
        return result
      })
  },

  patch(url, data, config = {}) {
    const rewritten = rewriteContentPath(url)
    const isFormData = data instanceof FormData
    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...getAuthHeader(),
      ...getCsrfHeader(),
      ...(config.headers || {}),
    }
    const body = isFormData ? data : (data !== undefined ? JSON.stringify(data) : undefined)

    return authenticatedRequest('PATCH', rewritten, { headers, body, signal: config.signal })
      .then((result) => {
        clearApiCache()
        return result
      })
  },

  delete(url, config = {}) {
    const rewritten = rewriteContentPath(url)
    const headers = {
      ...getAuthHeader(),
      ...getCsrfHeader(),
      ...(config.headers || {}),
    }

    return authenticatedRequest('DELETE', rewritten, { headers, signal: config.signal })
      .then((result) => {
        clearApiCache()
        return result
      })
  },
}

function getCacheStats() {
  return {
    size: requestCache.size,
    keys: Array.from(requestCache.keys()),
  }
}

function clearApiCache(pattern) {
  if (!pattern) {
    requestCache.clear()
    return
  }
  for (const key of requestCache.keys()) {
    if (key.includes(pattern)) {
      requestCache.delete(key)
    }
  }
}

function getCancelable(url, config = {}) {
  const controller = new AbortController()
  const merged = { ...config, signal: controller.signal }
  return {
    data: api.get(url, merged),
    controller,
  }
}

// Load any stored CSRF token on module init
loadStoredCsrfToken()

export { api, getCacheStats, clearApiCache, getCancelable }
