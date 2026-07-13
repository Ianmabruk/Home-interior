/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect -- async auth load is the intended effect purpose */
import { createContext, useContext, useEffect, useMemo, useCallback, useState } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hok_access_token') : null
    return !token
  })

  const loadUser = useCallback(async () => {
    try {
      console.info('[auth] loading user profile')
      const response = await api.get('/users/me')
      setUser(response.data)
      console.info('[auth] user profile loaded:', response.data?.email)
    } catch (err) {
      console.warn('[auth] failed to load user profile:', err?.response?.status, err?.message)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hok_access_token') : null
    if (!token) return
    console.info('[auth] access token found, restoring session')
    loadUser()
  }, [loadUser])

  const login = async (email, password) => {
    console.info('[auth] login attempt:', email)
    const response = await api.post('/auth/login', { email, password })
    localStorage.setItem('hok_access_token', response.data.accessToken)
    setUser(response.data.user)
    console.info('[auth] login success:', response.data.user?.email)
    return response
  }

  const register = async (fullName, email, password) => {
    console.info('[auth] register attempt:', email)
    const response = await api.post('/auth/register', { fullName, email, password })
    localStorage.setItem('hok_access_token', response.data.accessToken)
    setUser(response.data.user)
    console.info('[auth] register success:', response.data.user?.email)
    return response
  }

  const logout = async () => {
    console.info('[auth] logout')
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem('hok_access_token')
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refreshUser: loadUser,
    }),
    [user, loading, loadUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
