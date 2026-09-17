import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { api, attemptTokenRefresh } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('hok_access_token')
    return !!token
  })
  const cancelledRef = useRef(false)

  const validateSession = useCallback(async () => {
    const token = localStorage.getItem('hok_access_token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    cancelledRef.current = false

    const MAX_ATTEMPTS = 2
    let attempt = 0
    while (attempt <= MAX_ATTEMPTS && !cancelledRef.current) {
      try {
        const res = await api.get('/auth/me')
        if (!cancelledRef.current) setUser(res.data || null)
        break
      } catch (err) {
        if (cancelledRef.current) break
        const status = err?.response?.status

        // Network/5xx errors — retry with backoff (could be cold-start, temporary outage)
        const shouldRetry = !status || status >= 500 || status === 429 || status === 408 || status === 503
        if (shouldRetry) {
          attempt += 1
          if (attempt > MAX_ATTEMPTS) {
            // Preserve existing user state on transient failures; just stop.
            break
          }
          const delay = Math.min(1000 * 2 ** (attempt - 1), 3000) + Math.random() * 200
          await new Promise((r) => setTimeout(r, delay))
          continue
        }

        // 401 — the access token is expired or invalid. Try a refresh
        // using the httpOnly refresh cookie BEFORE clearing the session.
        if (status === 401) {
          try {
            await attemptTokenRefresh()
            // Refresh succeeded — retry the /auth/me call
            continue
          } catch {
            // Refresh genuinely failed (token revoked, etc.) — clear session
            localStorage.removeItem('hok_access_token')
            localStorage.removeItem('hok_csrf_token')
            if (!cancelledRef.current) setUser(null)
            break
          }
        }

        // Any other 4xx (403, 404, etc.) — preserve session, stop retrying
        break
      }
    }

    if (!cancelledRef.current) setLoading(false)
  }, [])

  useEffect(() => {
    validateSession()
    return () => { cancelledRef.current = true }
  }, [validateSession])

  // Session re-validation on tab visibility / app resume is handled centrally
  // by AppLifecycleProvider to avoid duplicate /auth/me calls when both this
  // provider and AppLifecycleProvider register useAppLifecycle hooks.

  const handleAuthFailed = useCallback(() => {
    setUser(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    window.addEventListener('hok-auth-failed', handleAuthFailed)
    return () => window.removeEventListener('hok-auth-failed', handleAuthFailed)
  }, [handleAuthFailed])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const accessToken = res.data?.accessToken
    if (accessToken) {
      localStorage.setItem('hok_access_token', accessToken)
      setUser(res.data?.user || null)
    }
    return res.data
  }, [])

  const register = useCallback(async (fullName, email, password, phone) => {
    const res = await api.post('/auth/register', { fullName, email, password, phone })
    const data = res.data
    if (data?.accessToken) {
      localStorage.setItem('hok_access_token', data.accessToken)
      setUser(data.user || null)
      return { success: true, user: data.user, needsLogin: false }
    }
    if (data?.user?.id || data?._id) {
      return { success: true, user: data.user || data, needsLogin: true }
    }
    return { success: false, message: 'Registration failed' }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem('hok_access_token')
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const res = await api.get('/auth/me')
    setUser(res.data || null)
    return res.data
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
      refreshUser,
      validateSession,
    }),
    [user, loading, login, register, logout, refreshUser, validateSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
