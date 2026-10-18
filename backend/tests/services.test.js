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

  it('should create a service with a multipart media upload', async () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB4LqAAAAA1J0hUAAAAAXNSR0IArs4c6QAAAABJRU5ErkJggg==', 'base64')

    const res = await request(app)
      .post(`${API}/admin/services`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .attach('media', png, { filename: 'service-upload.png', contentType: 'image/png' })
      .field('title', 'test_Service Upload')
      .field('description', 'Uploaded media service')
      .field('featured', 'false')
      .field('displayOrder', '4')

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('test_Service Upload')
    expect(res.body.data.imageUrl || res.body.data.mediaUrl).toBeTruthy()
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

  it('should reorder services persistently via the dedicated reorder endpoint', async () => {
    const first = await request(app)
      .post(`${API}/admin/services`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ title: 'test_Service Reorder A', description: 'A', featured: false, displayOrder: 0 })

    const second = await request(app)
      .post(`${API}/admin/services`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ title: 'test_Service Reorder B', description: 'B', featured: false, displayOrder: 1 })

    const reorderRes = await request(app)
      .patch(`${API}/admin/services/reorder`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ order: [{ id: second.body.data.id, displayOrder: 0 }, { id: first.body.data.id, displayOrder: 1 }] })

    expect(reorderRes.status).toBe(200)
    expect(reorderRes.body.success).toBe(true)

    const listRes = await request(app).get(`${API}/services`)
    const orderedTitles = listRes.body.data
      .filter((service) => service.title.startsWith('test_Service Reorder'))
      .map((service) => service.title)

    expect(orderedTitles).toEqual(['test_Service Reorder B', 'test_Service Reorder A'])
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
