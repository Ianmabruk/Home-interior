import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

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
]

const requestCache = new Map()
const CACHE_TTL = 5 * 60 * 1000

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hok_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const url = config.url || ''
  if (CONTENT_PATHS.some((p) => url === p || url.startsWith(p + '/'))) {
    config.url = '/content' + url
  }

  if (config.method === 'get') {
    const cacheKey = `${config.url}:${JSON.stringify(config.params || {})}`
    const cached = requestCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      config.meta = { ...config.meta, __cachedResponse: cached.data }
    }
  }

  return config
})

let refreshingPromise = null
let refreshFailed = false

api.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && typeof data === 'object' && 'success' in data && data.success === true) {
      return { ...response, data: data.data ?? null }
    }
    return response
  },
  async (error) => {
    const status = error?.response?.status
    const originalRequest = error.config

    if (status !== 401 || originalRequest._retry || originalRequest.url?.includes('/auth/refresh')) {
      const message = error?.response?.data?.message || error?.message || 'Request failed'
      return Promise.reject(new Error(message))
    }

    if (refreshFailed) {
      refreshFailed = false
      const message = error?.response?.data?.message || error?.message || 'Session expired'
      return Promise.reject(new Error(message))
    }

    if (!refreshingPromise) {
      console.info('[auth] access token expired — attempting refresh')
      refreshingPromise = api
        .post('/auth/refresh')
        .then((res) => {
          const accessToken = res.data?.accessToken
          if (!accessToken) throw new Error('No access token in refresh response')
          localStorage.setItem('hok_access_token', accessToken)
          console.info('[auth] access token refreshed')
          return accessToken
        })
        .catch((refreshErr) => {
          console.warn('[auth] refresh failed:', refreshErr?.response?.status, refreshErr?.message)
          localStorage.removeItem('hok_access_token')
          refreshFailed = true
          return Promise.reject(refreshErr)
        })
        .finally(() => {
          refreshingPromise = null
        })
    }

    try {
      const newToken = await refreshingPromise
      originalRequest._retry = true
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return api(originalRequest)
    } catch {
      return Promise.reject(error)
    }
  },
)

const shouldCache = (config) => {
  const method = (config.method || 'get').toLowerCase()
  if (method !== 'get') return false
  const url = config.url || ''
  if (url.includes('/auth/')) return false
  if (url.includes('/upload')) return false
  if (url.includes('/delete')) return false
  if (url.includes('/newsletter')) return false
  if (url.startsWith('/content/auth')) return false
  return true
}

const originals = { get: api.get, post: api.post, put: api.put, patch: api.patch, delete: api.delete }

api.get = function (url, config) {
  if (!shouldCache({ url, ...config })) {
    return originals.get.call(api, url, config)
  }
  const cacheKey = `get:${url}:${JSON.stringify(config?.params || {})}`
  const cached = requestCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return Promise.resolve({
      data: cached.data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url, method: 'get' },
    })
  }
  return originals.get.call(api, url, config).then((response) => {
    requestCache.set(cacheKey, { data: response.data, timestamp: Date.now() })
    return response
  })
}

api.post = function (url, data, config) {
  return originals.post.call(api, url, data, config).then((response) => {
    clearApiCache(url)
    return response
  })
}

api.put = function (url, data, config) {
  return originals.put.call(api, url, data, config).then((response) => {
    clearApiCache(url)
    return response
  })
}

api.patch = function (url, data, config) {
  return originals.patch.call(api, url, data, config).then((response) => {
    clearApiCache(url)
    return response
  })
}

api.delete = function (url, config) {
  return originals.delete.call(api, url, config).then((response) => {
    clearApiCache(url)
    return response
  })
}

export function getCacheStats() {
  return {
    size: requestCache.size,
    keys: Array.from(requestCache.keys()),
  }
}

export function clearApiCache(pattern) {
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

export function getCancelable(url, config = {}) {
  const controller = new AbortController()
  const merged = { ...config, signal: controller.signal }
  return {
    data: api.get(url, merged),
    controller,
  }
}

export default api