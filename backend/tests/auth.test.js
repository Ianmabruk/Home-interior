import request from 'supertest'
import { getApp } from './lazyApp.js'
import { prisma } from '../src/config/database.js'
import bcrypt from 'bcryptjs'

const API = '/api'

let app = null

beforeAll(async () => {
  app = await getApp()
})

function generateTestEmail() {
  return `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.com`
}

async function createTestAdmin(email) {
  const passwordHash = await bcrypt.hash('TestPass123!', 12)
  return prisma.admin.create({
    data: { email, fullName: 'Test Admin', passwordHash, role: 'ADMIN' },
    select: { id: true, email: true, fullName: true, role: true },
  })
}

async function getAuthToken(email, password = 'TestPass123!') {
  const res = await request(app).post(`${API}/auth/login`).send({ email, password })
  return res.body?.data?.accessToken || null
}

describe('Auth', () => {
  it('should login with valid credentials', async () => {
    const email = generateTestEmail()
    await createTestAdmin(email)

    const res = await request(app)
      .post(`${API}/auth/login`)
      .send({ email, password: 'TestPass123!' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.accessToken).toBeDefined()
    expect(res.body.data.user.role).toBe('ADMIN')
  })

  it('should reject login with invalid password', async () => {
    const email = generateTestEmail()
    await createTestAdmin(email)

    const res = await request(app)
      .post(`${API}/auth/login`)
      .send({ email, password: 'WrongPass' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('should get current user with valid token', async () => {
    const email = generateTestEmail()
    await createTestAdmin(email)
    const token = await getAuthToken(email)

    const res = await request(app)
      .get(`${API}/auth/me`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.email).toBe(email)
  })

  it('should reject unauthenticated access to /auth/me', async () => {
    const res = await request(app).get(`${API}/auth/me`)
    expect(res.status).toBe(401)
  })

  it('should refresh access token', async () => {
    const email = generateTestEmail()
    await createTestAdmin(email)
    const loginRes = await request(app)
      .post(`${API}/auth/login`)
      .send({ email, password: 'TestPass123!' })

    const csrfToken = loginRes.body?.data?.csrfToken
    const cookieHeader = loginRes.headers['set-cookie']?.find(c => c.startsWith('refreshToken='))
    const refreshToken = cookieHeader?.split(';')[0]?.split('=').slice(1).join('=')

    const res = await request(app)
      .post(`${API}/auth/refresh`)
      .set('Cookie', `refreshToken=${encodeURIComponent(refreshToken || '')}`)
      .set('x-csrf-token', csrfToken || '')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.accessToken).toBeDefined()
  })

  it('should logout successfully', async () => {
    const email = generateTestEmail()
    await createTestAdmin(email)
    const loginRes = await request(app)
      .post(`${API}/auth/login`)
      .send({ email, password: 'TestPass123!' })

    const refreshToken = loginRes.headers['set-cookie']?.find(c => c.startsWith('refreshToken='))?.split(';')[0]?.split('=')[1]

    const res = await request(app)
      .post(`${API}/auth/logout`)
      .set('Cookie', `refreshToken=${refreshToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})
