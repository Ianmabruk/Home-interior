import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { api, clearApiCache } from '../services/api'
import { useAppLifecycle } from '../hooks/useAppLifecycle'

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
    try {
      const res = await api.get('/auth/me')
      if (!cancelledRef.current) setUser(res.data || null)
    } catch (err) {
      if (!cancelledRef.current) {
        const status = err?.response?.status
        if (status === 401) {
          localStorage.removeItem('hok_access_token')
          setUser(null)
        }
        // On 5xx / network errors, keep existing user state and retry later
      }
    } finally {
      if (!cancelledRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    validateSession()
    return () => { cancelledRef.current = true }
  }, [validateSession])

  // Track when the tab was last visible so we only re-validate after meaningful
  // idle periods (>= 10 minutes) rather than on every focus/tab-switch.
  const lastVisibleRef = useRef(Date.now())

  useAppLifecycle({
    onVisible: () => {
      const token = localStorage.getItem('hok_access_token')
      const idleMs = Date.now() - lastVisibleRef.current
      lastVisibleRef.current = Date.now()

      if (token && idleMs >= 10 * 60 * 1000) {
        // After 10+ minutes of inactivity: re-validate session AND clear the
        // in-memory API cache so all pages refetch fresh data from the backend.
        clearApiCache()
        validateSession()
      } else if (token && idleMs >= 60 * 1000) {
        // After 1+ minute: just re-validate the session token silently.
        validateSession()
      }
    },
    onHidden: () => {
      lastVisibleRef.current = Date.now()
    },
  })

  useEffect(() => {
    const handler = () => {
      setUser(null)
      setLoading(false)
    }
    window.addEventListener('hok-auth-failed', handler)
    return () => window.removeEventListener('hok-auth-failed', handler)
  }, [])

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
