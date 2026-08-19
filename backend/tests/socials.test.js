import request from 'supertest'
import { getApp } from './lazyApp.js'
import { createTestAdmin, getAuthToken, generateTestEmail } from './helpers.js'

let app = null

beforeAll(async () => {
  app = await getApp()
})

const API = '/api'

describe('Socials', () => {
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

  it('should list social items publicly', async () => {
    const res = await request(app).get(`${API}/socials`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('should create a social item as admin', async () => {
    const res = await request(app)
      .post(`${API}/admin/socials`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ name: 'test_Instagram', platform: 'instagram', link: 'https://instagram.com/test', displayOrder: 0, isActive: true })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe('test_Instagram')
  })

  it('should update a social item as admin', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/socials`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ name: 'test_Facebook', platform: 'facebook', link: 'https://facebook.com/test', displayOrder: 0, isActive: true })

    const id = createRes.body.data.id
    const res = await request(app)
      .patch(`${API}/admin/socials/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ name: 'test_Facebook Updated' })

    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('test_Facebook Updated')
  })

  it('should delete a social item as admin', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/socials`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ name: 'test_TikTok', platform: 'tiktok', link: 'https://tiktok.com/test', displayOrder: 0, isActive: true })

    const id = createRes.body.data.id
    const res = await request(app)
      .delete(`${API}/admin/socials/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('should reject unauthenticated social creation', async () => {
    const res = await request(app)
      .post(`${API}/admin/socials`)
      .send({ name: 'test_NoAuth', platform: 'instagram', link: 'https://instagram.com/test' })

    expect(res.status).toBe(401)
  })
})
