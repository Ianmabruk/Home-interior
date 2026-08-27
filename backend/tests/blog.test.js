import request from 'supertest'
import { getApp } from './lazyApp.js'
import { createTestAdmin, getAuthToken, generateTestEmail } from './helpers.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

const loadTestVideo = () => {
  const videoPath = path.join('/tmp', 'test-video.mp4')
  const buffer = fs.readFileSync(videoPath)
  return { buffer, name: 'test-video.mp4' }
}

describe('Blog', () => {
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
      .set('x-csrf-token', csrfToken)
      .send({ title: 'test_Blog Alpha', description: 'Test desc', content: 'Content', category: 'Design', published: true })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('test_Blog Alpha')
  })

  it('should get a blog post by id', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/blog`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
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
      .set('x-csrf-token', csrfToken)
      .send({ title: 'test_Blog Gamma', description: 'Gamma', content: 'Gamma content', category: 'Architecture', published: true })

    const id = createRes.body.data.id
    const res = await request(app)
      .patch(`${API}/admin/blog/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ title: 'test_Blog Gamma Updated' })

    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('test_Blog Gamma Updated')
  })

  it('should delete a blog post as admin', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/blog`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ title: 'test_Blog Delta', description: 'Delta', content: 'Delta content', category: 'Trends', published: true })

    const id = createRes.body.data.id
    const res = await request(app)
      .delete(`${API}/admin/blog/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('should create a blog post with video as admin', async () => {
    const img = makeFakeImage('test_blog_image.png')
    const video = loadTestVideo()

    const res = await request(app)
      .post(`${API}/admin/blog`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .field('title', 'test_Blog Video Upload')
      .field('description', 'Video upload test')
      .field('content', 'Content')
      .field('category', 'Design')
      .field('published', 'true')
      .attach('image', img.buffer, img.name)
      .attach('video', video.buffer, video.name)

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('test_Blog Video Upload')
    expect(res.body.data.videoUrl).toBeDefined()
  })

  it('should update a blog post with video as admin', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/blog`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ title: 'test_Blog Video Update', description: 'Update', content: 'Content', category: 'Design', published: true })

    const id = createRes.body.data.id
    const video = loadTestVideo()

    const res = await request(app)
      .patch(`${API}/admin/blog/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .field('title', 'test_Blog Video Updated')
      .attach('video', video.buffer, video.name)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('test_Blog Video Updated')
    expect(res.body.data.videoUrl).toBeDefined()
  })
})
