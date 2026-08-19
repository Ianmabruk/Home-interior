import request from 'supertest'
import { getApp } from './lazyApp.js'
import { createTestAdmin, getAuthToken, generateTestEmail } from './helpers.js'

let app = null

beforeAll(async () => {
  app = await getApp()
})

const API = '/api'

describe('Services', () => {
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

  it('should list services publicly', async () => {
    const res = await request(app).get(`${API}/services`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('should create a service as admin', async () => {
    const res = await request(app)
      .post(`${API}/admin/services`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ title: 'test_Service Alpha', description: 'Test description', featured: false, displayOrder: 0 })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('test_Service Alpha')
  })

  it('should get a service by id', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/services`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ title: 'test_Service Beta', description: 'Beta desc', featured: false, displayOrder: 1 })

    const id = createRes.body.data.id
    const res = await request(app).get(`${API}/services/${id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('test_Service Beta')
  })

  it('should update a service as admin', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/services`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ title: 'test_Service Gamma', description: 'Gamma', featured: false, displayOrder: 2 })

    const id = createRes.body.data.id
    const res = await request(app)
      .patch(`${API}/admin/services/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ title: 'test_Service Gamma Updated' })

    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('test_Service Gamma Updated')
  })

  it('should delete a service as admin', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/services`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ title: 'test_Service Delta', description: 'Delta', featured: false, displayOrder: 3 })

    const id = createRes.body.data.id
    const res = await request(app)
      .delete(`${API}/admin/services/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('should reject unauthenticated admin service creation', async () => {
    const res = await request(app)
      .post(`${API}/admin/services`)
      .send({ title: 'test_NoAuth', description: 'Should fail' })

    expect(res.status).toBe(401)
  })
})
