import request from 'supertest'
import { app } from '../src/app.js'
import { createTestAdmin, getAuthToken, generateTestEmail } from './helpers.js'

const API = '/api'

describe('Portfolio', () => {
  let adminToken
  let adminEmail

  beforeEach(async () => {
    adminEmail = generateTestEmail()
    await createTestAdmin(adminEmail)
    adminToken = await getAuthToken(adminEmail)
  })

  it('should list portfolio publicly', async () => {
    const res = await request(app).get(`${API}/portfolio`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('should create a portfolio project as admin', async () => {
    const res = await request(app)
      .post(`${API}/admin/portfolio`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'test_Project Alpha', description: 'Test desc', category: 'Residential', featured: false, displayOrder: 0 })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('test_Project Alpha')
  })

  it('should get a portfolio project by id', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/portfolio`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'test_Project Beta', description: 'Beta', category: 'Commercial', featured: true, displayOrder: 1 })

    const id = createRes.body.data.id
    const res = await request(app).get(`${API}/portfolio/${id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('test_Project Beta')
  })

  it('should update a portfolio project as admin', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/portfolio`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'test_Project Gamma', description: 'Gamma', category: 'Interior', featured: false, displayOrder: 2 })

    const id = createRes.body.data.id
    const res = await request(app)
      .patch(`${API}/admin/portfolio/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'test_Project Gamma Updated' })

    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('test_Project Gamma Updated')
  })

  it('should delete a portfolio project as admin', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/portfolio`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'test_Project Delta', description: 'Delta', category: 'Office', featured: false, displayOrder: 3 })

    const id = createRes.body.data.id
    const res = await request(app)
      .delete(`${API}/admin/portfolio/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('should persist portfolio data across requests (simulated session)', async () => {
    const uniqueTitle = `test_PERSIST-${Date.now()}`
    const createRes = await request(app)
      .post(`${API}/admin/portfolio`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: uniqueTitle, description: 'Persistence test', category: 'Test', featured: false, displayOrder: 0 })

    expect(createRes.status).toBe(201)
    const id = createRes.body.data.id

    const freshRes = await request(app).get(`${API}/portfolio/${id}`)
    expect(freshRes.status).toBe(200)
    expect(freshRes.body.data.title).toBe(uniqueTitle)
    expect(freshRes.body.data.id).toBe(id)

    const listRes = await request(app).get(`${API}/portfolio`)
    expect(listRes.status).toBe(200)
    const found = listRes.body.data.find((p) => (p.id || p._id) === id)
    expect(found).toBeDefined()
    expect(found.title).toBe(uniqueTitle)
  })
})
