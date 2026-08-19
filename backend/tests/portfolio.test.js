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

describe('Portfolio', () => {
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

  const createProject = (extra = {}) =>
    request(app)
      .post(`${API}/admin/portfolio`)
      .set(authHeaders())
      .send({ title: 'test_Portfolio', description: 'desc', category: 'Residential', featured: false, displayOrder: 0, ...extra })

  it('should list portfolio publicly', async () => {
    const res = await request(app).get(`${API}/portfolio`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('should create a portfolio project as admin', async () => {
    const res = await createProject({ title: 'test_Project Alpha' })
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('test_Project Alpha')
  })

  it('should get a portfolio project by id', async () => {
    const createRes = await createProject({ title: 'test_Project Beta' })
    const id = createRes.body.data.id
    const res = await request(app).get(`${API}/portfolio/${id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('test_Project Beta')
  })

  it('should update a portfolio project as admin', async () => {
    const createRes = await createProject({ title: 'test_Project Gamma' })
    const id = createRes.body.data.id
    const res = await request(app)
      .patch(`${API}/admin/portfolio/${id}`)
      .set(authHeaders())
      .send({ title: 'test_Project Gamma Updated' })
    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('test_Project Gamma Updated')
  })

  it('should delete a portfolio project as admin', async () => {
    const createRes = await createProject({ title: 'test_Project Delta' })
    const id = createRes.body.data.id
    const res = await request(app).delete(`${API}/admin/portfolio/${id}`).set(authHeaders())
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('should persist portfolio data across requests (simulated session)', async () => {
    const uniqueTitle = `test_PERSIST-${Date.now()}`
    const createRes = await createProject({ title: uniqueTitle })
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

  it('should return beforeImages and afterImages arrays in portfolio response', async () => {
    const res = await createProject({ title: 'test_BeforeAfterFields' })
    expect(res.status).toBe(201)
    expect(res.body.data.beforeImages).toEqual([])
    expect(res.body.data.afterImages).toEqual([])

    const detailRes = await request(app).get(`${API}/portfolio/${res.body.data.id}`)
    expect(detailRes.status).toBe(200)
    expect(detailRes.body.data.beforeImages).toEqual([])
    expect(detailRes.body.data.afterImages).toEqual([])
  })

  it('should accept up to 21 gallery images', async () => {
    const req = request(app)
      .post(`${API}/admin/portfolio`)
      .set(authHeaders())
      .field('title', 'test_21Images')
      .field('description', 'Testing 21 image limit')
      .field('category', 'Test')
      .field('featured', 'false')
      .field('displayOrder', '0')

    for (let i = 0; i < 21; i++) {
      const img = makeFakeImage(`image_${i + 1}.png`)
      req.attach('gallery', img.buffer, img.name)
    }

    const res = await req
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
  })

  it('should accept before and after images', async () => {
    const beforeImg1 = makeFakeImage('before_1.png')
    const beforeImg2 = makeFakeImage('before_2.png')
    const afterImg1 = makeFakeImage('after_1.png')
    const afterImg2 = makeFakeImage('after_2.png')

    const res = await request(app)
      .post(`${API}/admin/portfolio`)
      .set(authHeaders())
      .field('title', 'test_BeforeAfterUpload')
      .field('description', 'Testing before/after uploads')
      .field('category', 'Test')
      .field('featured', 'false')
      .field('displayOrder', '0')
      .attach('before', beforeImg1.buffer, beforeImg1.name)
      .attach('before', beforeImg2.buffer, beforeImg2.name)
      .attach('after', afterImg1.buffer, afterImg1.name)
      .attach('after', afterImg2.buffer, afterImg2.name)

    expect(res.status).toBe(201)
    expect(res.body.data.beforeImages).toHaveLength(2)
    expect(res.body.data.afterImages).toHaveLength(2)
  })

  it('should preserve existing before/after images when adding new ones', async () => {
    const beforeImg = makeFakeImage('before_1.png')
    const afterImg = makeFakeImage('after_1.png')

    const createRes = await request(app)
      .post(`${API}/admin/portfolio`)
      .set(authHeaders())
      .field('title', 'test_PreserveBeforeAfter')
      .field('description', 'Testing preservation')
      .field('category', 'Test')
      .attach('before', beforeImg.buffer, beforeImg.name)
      .attach('after', afterImg.buffer, afterImg.name)

    expect(createRes.status).toBe(201)
    expect(createRes.body.data.beforeImages).toHaveLength(1)
    expect(createRes.body.data.afterImages).toHaveLength(1)

    const projectId = createRes.body.data.id
    const existingBefore = createRes.body.data.beforeImages[0]
    const existingAfter = createRes.body.data.afterImages[0]

    const newBefore = makeFakeImage('before_2.png')
    const newAfter = makeFakeImage('after_2.png')

    const updateRes = await request(app)
      .patch(`${API}/admin/portfolio/${projectId}`)
      .set(authHeaders())
      .field('beforeImages', existingBefore)
      .field('afterImages', existingAfter)
      .attach('before', newBefore.buffer, newBefore.name)
      .attach('after', newAfter.buffer, newAfter.name)

    expect(updateRes.status).toBe(200)
    expect(updateRes.body.data.beforeImages).toHaveLength(2)
    expect(updateRes.body.data.afterImages).toHaveLength(2)
  })
})