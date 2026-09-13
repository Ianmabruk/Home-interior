import request from 'supertest'
import { getApp } from './lazyApp.js'
import { createTestAdmin, getAuthToken, generateTestEmail } from './helpers.js'

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

describe('Virtual Designs', () => {
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

  const authHeaders = () => ({
    Authorization: `Bearer ${adminToken}`,
    'x-csrf-token': csrfToken,
  })

  const createProject = (title = 'test_VirtualDesign') => {
    const img = makeFakeImage('test_vd_main.png')
    return request(app)
      .post(`${API}/admin/virtual-designs`)
      .set(authHeaders())
      .field('title', title)
      .field('description', 'desc')
      .field('category', 'Residential')
      .field('mediaType', 'image')
      .field('featured', 'false')
      .field('displayOrder', '0')
      .attach('media', img.buffer, img.name)
  }

  it('should list virtual designs publicly', async () => {
    const res = await request(app).get(`${API}/virtual-design`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('should create a virtual design as admin', async () => {
    const res = await createProject('test_VD Alpha')
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('test_VD Alpha')
  })

  it('should get a virtual design by id', async () => {
    const createRes = await createProject('test_VD Beta')
    const id = createRes.body.data.id
    const res = await request(app).get(`${API}/virtual-design/${id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('test_VD Beta')
  })

  it('should update a virtual design as admin', async () => {
    const createRes = await createProject('test_VD Gamma')
    const id = createRes.body.data.id
    const res = await request(app)
      .patch(`${API}/admin/virtual-designs/${id}`)
      .set(authHeaders())
      .send({ title: 'test_VD Gamma Updated' })
    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('test_VD Gamma Updated')
  })

  it('should delete a virtual design as admin', async () => {
    const createRes = await createProject('test_VD Delta')
    const id = createRes.body.data.id
    const res = await request(app).delete(`${API}/admin/virtual-designs/${id}`).set(authHeaders())
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('should accept exactly 10 gallery images on create', async () => {
    const mainImg = makeFakeImage('main.png')
    const req = request(app)
      .post(`${API}/admin/virtual-designs`)
      .set(authHeaders())
      .field('title', 'test_VD GalleryMax')
      .field('category', 'Test')
      .field('mediaType', 'image')
      .attach('media', mainImg.buffer, mainImg.name)

    for (let i = 0; i < 10; i++) {
      const img = makeFakeImage(`gallery_${i}.png`)
      req.attach('gallery', img.buffer, img.name)
    }

    const res = await req
    expect(res.status).toBe(201)
    expect(res.body.data.mediaUrls).toHaveLength(10)
  })

  it('should reject more than 10 gallery images on create', async () => {
    const req = request(app)
      .post(`${API}/admin/virtual-designs`)
      .set(authHeaders())
      .field('title', 'test_VD GalleryLimit')
      .field('category', 'Test')
      .field('mediaType', 'image')

    for (let i = 0; i < 11; i++) {
      const img = makeFakeImage(`img_${i}.png`)
      req.attach('gallery', img.buffer, img.name)
    }

    const res = await req
    expect(res.status).toBe(400)
  })

  it('should reject update exceeding 10 total gallery items', async () => {
    const createRes = await createProject('test_VD GalleryExceed')
    const id = createRes.body.data.id

    const existingUrls = Array.from({ length: 5 }, (_, i) => `https://example.com/existing_${i}.png`)

    const patchReq = request(app)
      .patch(`${API}/admin/virtual-designs/${id}`)
      .set(authHeaders())
      .field('existingMediaUrls', JSON.stringify(existingUrls))

    for (let i = 0; i < 7; i++) {
      const img = makeFakeImage(`img_${i}.png`)
      patchReq.attach('gallery', img.buffer, img.name)
    }

    const res = await patchReq
    expect(res.status).toBe(400)
  })
})
