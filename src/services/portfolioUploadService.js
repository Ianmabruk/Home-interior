import { api } from './api'
import { ensureValidToken } from './api'

export const UPLOAD_CONCURRENCY = 3
export const MAX_RETRIES = 3
export const RETRY_BASE_DELAY = 1000

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504])

function getErrorMessage(err) {
  if (err?.response?.data?.message) return err.response.data.message
  if (err?.message) return err.message
  return 'Upload failed'
}

function isRetryableError(err) {
  const status = err?.response?.status
  if (!status) return true
  return RETRYABLE_STATUSES.has(status)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function jitter(base) {
  return base + Math.random() * base * 0.3
}

/**
 * Pre-warm the backend before starting uploads. On Render free-tier, the
 * server spins down after 15 minutes of inactivity, making the first request
 * take 30-60 seconds. A lightweight health-check request wakes the instance
 * so the subsequent upload doesn't pay the cold-start penalty.
 */
export async function warmServer() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)
    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
    await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
  } catch {
    // Non-fatal — the upload will still work, just possibly slower.
  }
}

export async function refreshCsrf() {
  try {
    // Use fetch directly with credentials so the httpOnly refresh-token cookie
    // is sent — api.post would require a valid access token which may be the
    // reason we're here in the first place.
    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Refresh failed')
    const data = await response.json()
    const accessToken = data?.data?.accessToken
    if (accessToken) localStorage.setItem('hok_access_token', accessToken)
    return data?.data?.csrfToken
  } catch (refreshErr) {
    throw new Error('Failed to refresh CSRF token', { cause: refreshErr })
  }
}

export function validateImageFile(file) {
  const errors = []
  if (!file) {
    errors.push('File is required')
    return errors
  }
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  if (!validTypes.includes(file.type)) {
    errors.push(`Unsupported format: ${file.type || 'unknown'}`)
  }
  const MAX_SIZE = 50 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    errors.push(`File "${file.name}" exceeds maximum size of 50MB`)
  }
  if (file.size === 0) {
    errors.push(`File "${file.name}" is empty`)
  }
  const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase()
  if (!validExts.includes(ext)) {
    errors.push(`Invalid file extension: ${ext}`)
  }
  return errors
}

export async function uploadSingleImage(file, folder = 'portfolio/before', options = {}) {
  const { signal, onProgress, onStateChange, maxRetries = MAX_RETRIES } = options || {}

  onStateChange?.('compressing')

  // Warm the backend before starting. On Render free-tier, the server spins
  // down after 15 minutes of inactivity; a lightweight health-check wakes it
  // so the subsequent upload doesn't pay the cold-start penalty.
  await warmServer()

  // Ensure we have a valid token before starting the upload.
  // This prevents uploads from being sent with an already-expired token.
  try {
    await ensureValidToken()
  } catch (tokenErr) {
    onStateChange?.('failed')
    throw new Error(`Authentication required: ${tokenErr.message}`, { cause: tokenErr })
  }

  const formData = new FormData()
  formData.append('media', file)
  formData.append('folder', folder)

  let attempt = 0
  let lastError = null

  while (attempt <= maxRetries) {
    if (attempt > 0) {
      const delay = jitter(RETRY_BASE_DELAY * Math.pow(2, attempt - 1))
      onStateChange?.('retrying')
      await sleep(delay)
    }

    onStateChange?.('uploading')

    try {
      // Re-check token validity before each attempt — long uploads may
      // cross the token expiry boundary.
      try {
        await ensureValidToken()
      } catch (tokenErr) {
        onStateChange?.('failed')
        throw new Error(`Authentication required: ${tokenErr.message}`, { cause: tokenErr })
      }

      const res = await api.post('/media/upload', formData, {
        signal,
        onUploadProgress: (e) => {
          if (onProgress && e.total > 0) {
            onProgress((e.loaded / e.total) * 100)
          }
        },
      })

      onStateChange?.('uploaded')
      return { url: res.data.url, path: res.data.path, fileName: file.name }
    } catch (err) {
      lastError = err
      if (signal?.aborted) {
        onStateChange?.('failed')
        throw err
      }

      const shouldRetry = attempt < maxRetries && isRetryableError(err)

      if (shouldRetry && (err?.response?.status === 401 || err?.response?.status === 403)) {
        try {
          await refreshCsrf()
        } catch (csrfErr) {
          console.warn('[upload] CSRF refresh failed during retry:', csrfErr?.message || csrfErr)
        }
      }

      if (shouldRetry) {
        attempt++
        continue
      }

      onStateChange?.('failed')
      const fileLabel = file?.name || `file_${attempt}`
      throw new Error(`Image "${fileLabel}" upload failed: ${getErrorMessage(err)}`, { cause: err })
    }
  }

  onStateChange?.('failed')
  throw new Error(`Image "${file?.name || 'unknown'}" upload failed after ${maxRetries} retries: ${getErrorMessage(lastError)}`, { cause: lastError })
}

export async function uploadImageBatch(files, folder = 'portfolio/before', options = {}) {
  const { signal, onImageProgress, onOverallProgress, maxRetries = MAX_RETRIES } = options || {}
  const results = new Array(files.length).fill(null)
  const states = files.map(() => ({ status: 'pending', progress: 0 }))

  const updateState = (idx, status, progress = null) => {
    states[idx] = { status, progress: progress !== null ? progress : states[idx].progress }
    onImageProgress?.(idx, states[idx].progress, files[idx]?.name, status)
  }

  const semaphore = (() => {
    let active = 0
    let waiting = []
    const next = () => {
      if (waiting.length > 0 && active < UPLOAD_CONCURRENCY) {
        active++
        const { resolve } = waiting.shift()
        resolve()
      }
    }
    return {
      acquire: () =>
        new Promise((resolve) => {
          if (active < UPLOAD_CONCURRENCY) {
            active++
            resolve()
          } else {
            waiting.push({ resolve })
          }
        }),
      release: () => {
        active--
        next()
      },
    }
  })()

  const uploadOne = async (idx) => {
    const file = files[idx]

    updateState(idx, 'compressing')

    const result = await uploadSingleImage(file, folder, {
      signal,
      maxRetries,
      onProgress: (p) => {
        updateState(idx, 'uploading', p)
      },
      onStateChange: (state) => {
        updateState(idx, state)
      },
    })

    results[idx] = result
    updateState(idx, 'completed', 100)
  }

  let settled = 0

  const tasks = files.map((_, idx) => {
    return (async () => {
      updateState(idx, 'queued')
      await semaphore.acquire()
      try {
        await uploadOne(idx)
       } catch (err) {
        results[idx] = { error: err, fileName: files[idx]?.name }
        updateState(idx, 'failed', 0)
      } finally {
        settled++
        semaphore.release()
        onOverallProgress?.((settled / files.length) * 100)
      }
    })()
  })

  await Promise.allSettled(tasks)
  return results
}

export async function uploadPortfolioImages(files, imageType, options = {}) {
  const { onImageProgress, onOverallProgress } = options
  const folder = `portfolio/${imageType}`
  const results = await uploadImageBatch(files, folder, {
    onImageProgress,
    onOverallProgress,
  })

  const successful = []
  const failed = []

  results.forEach((result, idx) => {
    if (result?.url) {
      successful.push({ url: result.url, path: result.path, index: idx })
    } else if (result?.error) {
      failed.push({ error: result.error, file: files[idx], index: idx })
    }
  })

  return { successful, failed, total: files.length }
}
