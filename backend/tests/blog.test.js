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

  it('should upload a video, persist metadata, and serve it publicly (end-to-end)', async () => {
    const videoPath = path.join('/tmp', 'kilo', 'hok-video.mp4')
    const videoBuffer = fs.readFileSync(videoPath)
    const video = { buffer: videoBuffer, name: 'hok-video.mp4' }
    const image = makeFakeImage('test_blog_image.png')

    const createRes = await request(app)
      .post(`${API}/admin/blog`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .field('title', 'test_Blog E2E Video Pipeline')
      .field('description', 'End-to-end video pipeline test')
      .field('content', 'Content')
      .field('category', 'Design')
      .field('published', 'true')
      .field('featured', 'true')
      .attach('image', image.buffer, image.name)
      .attach('video', video.buffer, video.name)

    expect(createRes.status).toBe(201)
    expect(createRes.body.success).toBe(true)
    const created = createRes.body.data
    expect(created.videoUrl).toBeDefined()
    expect(created.videoCloudinaryId).toBeDefined()
    expect(created.videoFormat).toBe('mp4')
    expect(created.videoResourceType).toBe('video')

    // The video's public_id must not be duplicated as "blogs/blogs/..."
    const publicId = created.videoCloudinaryId
    expect(publicId.startsWith('blogs/blogs/')).toBe(false)
    expect(publicId).not.toContain('blogs/blogs')

    // Public detail page returns the video + metadata
    const detailRes = await request(app).get(`${API}/blog/${created.id}`)
    expect(detailRes.status).toBe(200)
    expect(detailRes.body.data.videoUrl).toBe(created.videoUrl)
    expect(detailRes.body.data.videoCloudinaryId).toBe(publicId)

    // The public blog dashboard (list) includes the video blog
    const listRes = await request(app).get(`${API}/blog`)
    expect(listRes.status).toBe(200)
    const listed = listRes.body.data.find((b) => b.id === created.id)
    expect(listed).toBeDefined()
    expect(listed.videoUrl).toBe(created.videoUrl)

    // The stored video must be live, H.264/AAC MP4, with byte-range support
    const videoRes = await fetch(created.videoUrl, { method: 'GET', headers: { Range: 'bytes=0-0' } })
    expect(videoRes.status).toBe(206)
    const contentType = videoRes.headers.get('content-type') || ''
    expect(contentType).toContain('video/mp4')
    expect(contentType).toContain('avc1')
    expect(videoRes.headers.get('accept-ranges')).toBe('bytes')

    // Cleanup: delete the test blog (this deletes the Cloudinary video + image)
    const del = await request(app)
      .delete(`${API}/admin/blog/${created.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
    expect(del.status).toBe(200)
  })
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
