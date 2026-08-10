import request from 'supertest'
import { app } from '../src/app.js'
import { createTestAdmin, getAuthToken, generateTestEmail } from './helpers.js'

const API = '/api'

describe('Products', () => {
  let adminToken
  let adminEmail

  beforeEach(async () => {
    adminEmail = generateTestEmail()
    await createTestAdmin(adminEmail)
    adminToken = await getAuthToken(adminEmail)
  })

  it('should list products publicly', async () => {
    const res = await request(app).get(`${API}/products`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('should create a product as admin', async () => {
    const res = await request(app)
      .post(`${API}/admin/shop`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'test_Product Alpha', description: 'Test desc', price: 100, category: 'Furniture', stock: 10, sku: 'TEST-001' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe('test_Product Alpha')
  })

  it('should get a product by id', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/shop`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'test_Product Beta', description: 'Beta', price: 200, category: 'Lighting', stock: 5, sku: 'TEST-002' })

    const id = createRes.body.data.id
    const res = await request(app).get(`${API}/products/${id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('test_Product Beta')
  })

  it('should update a product as admin', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/shop`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'test_Product Gamma', description: 'Gamma', price: 300, category: 'Decor', stock: 8, sku: 'TEST-003' })

    const id = createRes.body.data.id
    const res = await request(app)
      .patch(`${API}/admin/shop/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'test_Product Gamma Updated' })

    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('test_Product Gamma Updated')
  })

  it('should delete a product as admin', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/shop`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'test_Product Delta', description: 'Delta', price: 400, category: 'Art', stock: 3, sku: 'TEST-004' })

    const id = createRes.body.data.id
    const res = await request(app)
      .delete(`${API}/admin/shop/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})
