import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('hok_access_token')
    return !!token
  })
  const cancelledRef = useRef(false)

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('hok_access_token')
    if (!token) {
      setLoading(false)
      return
    }
    cancelledRef.current = false
    try {
      const res = await api.get('/auth/me')
      if (!cancelledRef.current) setUser(res.data || null)
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) {
        localStorage.removeItem('hok_access_token')
      }
    } finally {
      if (!cancelledRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
    return () => { cancelledRef.current = true }
  }, [fetchUser])

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
    const user = res.data
    if (user?.id) {
      return { success: true, user, needsLogin: true }
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
      isCustomer: user?.role === 'CUSTOMER',
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, login, register, logout, refreshUser],
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