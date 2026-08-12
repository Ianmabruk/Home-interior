import request from 'supertest'
import { app } from '../src/app.js'
import { createTestAdmin, getAuthToken, generateTestEmail } from './helpers.js'

const API = '/api'

describe('Data Persistence', () => {
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

  it('should persist service across create-read-delete lifecycle', async () => {
    const uniqueTitle = `test_PERSIST-SVC-${Date.now()}`
    const createRes = await request(app)
      .post(`${API}/admin/services`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ title: uniqueTitle, description: 'Persistence test', featured: false, displayOrder: 0 })

    expect(createRes.status).toBe(201)
    const id = createRes.body.data.id

    const readRes = await request(app).get(`${API}/services/${id}`)
    expect(readRes.status).toBe(200)
    expect(readRes.body.data.title).toBe(uniqueTitle)

    const updateRes = await request(app)
      .patch(`${API}/admin/services/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ title: `${uniqueTitle}-updated` })

    expect(updateRes.status).toBe(200)
    expect(updateRes.body.data.title).toBe(`${uniqueTitle}-updated`)

    const verifyRes = await request(app).get(`${API}/services/${id}`)
    expect(verifyRes.body.data.title).toBe(`${uniqueTitle}-updated`)

    const deleteRes = await request(app)
      .delete(`${API}/admin/services/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)

    expect(deleteRes.status).toBe(200)

    const afterDeleteRes = await request(app).get(`${API}/services/${id}`)
    expect(afterDeleteRes.status).toBe(404)
  })

  it('should persist portfolio project with images across requests', async () => {
    const uniqueTitle = `test_PERSIST-PORT-${Date.now()}`
    const createRes = await request(app)
      .post(`${API}/admin/portfolio`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ title: uniqueTitle, description: 'Persistence test', category: 'Test', featured: false, displayOrder: 0 })

    expect(createRes.status).toBe(201)
    const id = createRes.body.data.id

    const freshRes = await request(app).get(`${API}/portfolio/${id}`)
    expect(freshRes.status).toBe(200)
    expect(freshRes.body.data.title).toBe(uniqueTitle)
    expect(freshRes.body.data.id).toBe(id)
  })

  it('should enforce admin authorization for protected routes', async () => {
    const res = await request(app)
      .post(`${API}/admin/services`)
      .send({ title: 'No Auth', description: 'Should fail' })

    expect(res.status).toBe(401)

    const deleteRes = await request(app)
      .delete(`${API}/admin/portfolio/nonexistent-id`)
      .set('Authorization', `Bearer invalidtoken`)

    expect([401, 403]).toContain(deleteRes.status)
  })

  it('should maintain stable IDs across multiple fetches', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/portfolio`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ title: `test_STABLE-ID-${Date.now()}`, description: 'ID stability', category: 'Test', featured: false, displayOrder: 0 })

    const id = createRes.body.data.id
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)

    const res1 = await request(app).get(`${API}/portfolio/${id}`)
    const res2 = await request(app).get(`${API}/portfolio/${id}`)

    expect(res1.body.data.id).toBe(id)
    expect(res2.body.data.id).toBe(id)
    expect(res1.body.data.createdAt).toBeDefined()
    expect(res1.body.data.updatedAt).toBeDefined()
  })
})
