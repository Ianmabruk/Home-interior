import request from 'supertest'
import { app } from '../src/app.js'
import { createTestAdmin, getAuthToken, generateTestEmail } from './helpers.js'

const API = '/api'

describe('Blog', () => {
  let adminToken
  let adminEmail

  beforeEach(async () => {
    adminEmail = generateTestEmail()
    await createTestAdmin(adminEmail)
    adminToken = await getAuthToken(adminEmail)
  })

  it('should list published blogs publicly', async () => {
    const res = await request(app).get(`${API}/blog`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('should create a blog post as admin', async () => {
    const res = await request(app)
      .post(`${API}/admin/blog`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'test_Blog Alpha', description: 'Test desc', content: 'Content', category: 'Design', published: true })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('test_Blog Alpha')
  })

  it('should get a blog post by id', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/blog`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'test_Blog Beta', description: 'Beta', content: 'Beta content', category: 'Interior', published: true })

    const id = createRes.body.data.id
    const res = await request(app).get(`${API}/blog/${id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('test_Blog Beta')
  })

  it('should update a blog post as admin', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/blog`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'test_Blog Gamma', description: 'Gamma', content: 'Gamma content', category: 'Architecture', published: true })

    const id = createRes.body.data.id
    const res = await request(app)
      .patch(`${API}/admin/blog/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'test_Blog Gamma Updated' })

    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('test_Blog Gamma Updated')
  })

  it('should delete a blog post as admin', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/blog`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'test_Blog Delta', description: 'Delta', content: 'Delta content', category: 'Trends', published: true })

    const id = createRes.body.data.id
    const res = await request(app)
      .delete(`${API}/admin/blog/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})
