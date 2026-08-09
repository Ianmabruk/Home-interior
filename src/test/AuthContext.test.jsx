import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../context/AuthContext'

vi.mock('@services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { api } from '@services/api'

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('initializes with no user when no token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('provides login and logout functions', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(typeof result.current.login).toBe('function')
    expect(typeof result.current.logout).toBe('function')
  })

  it('login stores token in localStorage', async () => {
    api.get.mockResolvedValue({ data: null })
    api.post.mockResolvedValue({
      data: { accessToken: 'test-token', user: { id: '1', email: 'test@test.com', role: 'USER' } },
    })
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await result.current.login('test@test.com', 'password')
    expect(localStorage.getItem('hok_access_token')).toBe('test-token')
    await waitFor(() => expect(result.current.user).toEqual({ id: '1', email: 'test@test.com', role: 'USER' }))
  })

  it('logout clears token and user', async () => {
    localStorage.setItem('hok_access_token', 'test-token')
    api.post.mockResolvedValue({ data: {} })
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await result.current.logout()
    expect(localStorage.getItem('hok_access_token')).toBeNull()
    expect(result.current.user).toBeNull()
  })

  it('401 response clears token', async () => {
    localStorage.setItem('hok_access_token', 'test-token')
    api.get.mockRejectedValue({ response: { status: 401 } })
    renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(localStorage.getItem('hok_access_token')).toBeNull())
  })

  it('loading state is true when token exists in localStorage', () => {
    localStorage.setItem('hok_access_token', 'test-token')
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(result.current.loading).toBe(true)
  })
})
