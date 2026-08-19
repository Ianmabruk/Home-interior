import request from 'supertest'
import { getApp } from './lazyApp.js'
import { createTestAdmin, getAuthToken, generateTestEmail } from './helpers.js'

let app = null

beforeAll(async () => {
  app = await getApp()
})

const API = '/api'

describe('About', () => {
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

  it('should get about page publicly', async () => {
    const res = await request(app).get(`${API}/about`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('should get about images publicly', async () => {
    const res = await request(app).get(`${API}/about/images`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('should update about content as admin', async () => {
    const res = await request(app)
      .put(`${API}/admin/about`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ title: 'test_About Us', description: 'Test about description', story: 'Our story' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('test_About Us')
  })

  it('should create an about image as admin', async () => {
    const minimalPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    )
    const res = await request(app)
      .post(`${API}/admin/about/images`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .attach('image', minimalPng, { filename: 'test.png', contentType: 'image/png' })
      .field('displayOrder', '0')
      .field('isActive', 'true')

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
  })

  it('should reject unauthenticated about update', async () => {
    const res = await request(app)
      .put(`${API}/admin/about`)
      .send({ title: 'No Auth' })

    expect(res.status).toBe(401)
  })
})
