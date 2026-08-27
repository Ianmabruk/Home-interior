import request from 'supertest'
import { getApp } from './lazyApp.js'
import { createTestAdmin, getAuthToken, generateTestEmail } from './helpers.js'

let app = null

beforeAll(async () => {
  app = await getApp()
})

const API = '/api'

const makeFakeImage = (name = 'test.png') => {
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#ccc"/></svg>',
  )
  return { buffer: svg, name }
}

describe('Circular Tabs', () => {
  let adminToken
  let csrfToken
  let adminEmail

  beforeEach(async () => {
    adminEmail = generateTestEmail()
    await createTestAdmin(adminEmail)
    const auth = await getAuthToken(adminEmail)
    adminToken = auth.accessToken
    csrfToken = auth.csrfToken
  })

  it('should list circular tabs as admin', async () => {
    const res = await request(app)
      .get(`${API}/admin/circular-tabs`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('should upload an image to a circular tab', async () => {
    const img = makeFakeImage('test_circular.png')

    const res = await request(app)
      .patch(`${API}/admin/circular-tabs/portfolio`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .attach('image', img.buffer, img.name)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.imageUrl).toBeDefined()
    expect(res.body.data.key).toBe('portfolio')
  })

  it('should remove image from a circular tab', async () => {
    const img = makeFakeImage('test_circular_remove.png')

    const updateRes = await request(app)
      .patch(`${API}/admin/circular-tabs/services`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .attach('image', img.buffer, img.name)

    expect(updateRes.status).toBe(200)

    const removeRes = await request(app)
      .delete(`${API}/admin/circular-tabs/services/image`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)

    expect(removeRes.status).toBe(200)
    expect(removeRes.body.success).toBe(true)
  })
})
