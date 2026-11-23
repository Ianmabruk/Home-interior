import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '../services/api'

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('API CSRF recovery', () => {
  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('uses the newly fetched CSRF token when retrying a request after 403', async () => {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))
    localStorage.setItem('hok_access_token', `header.${payload}.signature`)
    localStorage.setItem('hok_csrf_token', 'stale-token')
    localStorage.setItem('hok_csrf_token_at', String(Date.now()))

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ success: false, message: 'Invalid CSRF token' }, 403))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { csrfToken: 'fresh-token' } }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { accepted: true } }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(api.post('/admin/blog/cloudinary/signature', { publicId: 'test-public-id' }))
      .resolves.toMatchObject({ data: { accepted: true } })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[0][1].headers['x-csrf-token']).toBe('stale-token')
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/csrf')
    expect(fetchMock.mock.calls[2][1].headers['x-csrf-token']).toBe('fresh-token')
  })
})
