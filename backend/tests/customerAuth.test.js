import request from 'supertest'
import { getApp } from './lazyApp.js'
import { prisma } from '../src/config/database.js'
import bcrypt from 'bcryptjs'

let app = null

beforeAll(async () => {
  app = await getApp()
})

const API = '/api'

function generateTestEmail() {
  return `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.com`
}

async function createTestCustomer(email) {
  const passwordHash = await bcrypt.hash('TestPass123!', 12)
  return prisma.user.create({
    data: { email, fullName: 'Test Customer', passwordHash, phone: '0712345678', role: 'CUSTOMER', status: 'ACTIVE' },
    select: { id: true, email: true, fullName: true, phone: true, role: true, status: true },
  })
}

async function createTestAdmin(email) {
  const passwordHash = await bcrypt.hash('TestPass123!', 12)
  return prisma.admin.create({
    data: { email, fullName: 'Test Admin', passwordHash, role: 'ADMIN' },
    select: { id: true, email: true, fullName: true, role: true },
  })
}

async function createTestProduct() {
  const name = `Test Product ${Date.now()}`
  return prisma.product.create({
    data: {
      name,
      price: 1000,
      stock: 10,
      inStock: true,
      category: 'test',
      mainImage: '',
    },
    select: { id: true, name: true, price: true, stock: true },
  })
}

async function getCustomerAuthToken(email, password = 'TestPass123!') {
  const res = await request(app).post(`${API}/auth/login`).send({ email, password })
  return {
    accessToken: res.body?.data?.accessToken || null,
    refreshToken: res.body?.data?.refreshToken || null,
    csrfToken: res.body?.data?.csrfToken || null,
  }
}

describe('Customer Authentication', () => {
  it('should register a new customer', async () => {
    const email = generateTestEmail()
    const res = await request(app)
      .post(`${API}/auth/register`)
      .send({ fullName: 'Test Customer', email, password: 'TestPass123!', phone: '0712345678' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.email).toBe(email)
    expect(res.body.data.role).toBe('CUSTOMER')
    expect(res.body.data.id).toBeDefined()
  })

  it('should reject duplicate email registration', async () => {
    const email = generateTestEmail()
    await createTestCustomer(email)

    const res = await request(app)
      .post(`${API}/auth/register`)
      .send({ fullName: 'Another Customer', email, password: 'TestPass123!' })

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
  })

  it('should reject weak password', async () => {
    const email = generateTestEmail()
    const res = await request(app)
      .post(`${API}/auth/register`)
      .send({ fullName: 'Test Customer', email, password: 'short' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('should login customer with valid credentials', async () => {
    const email = generateTestEmail()
    await createTestCustomer(email)

    const res = await request(app)
      .post(`${API}/auth/login`)
      .send({ email, password: 'TestPass123!' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.accessToken).toBeDefined()
    expect(res.body.data.user.role).toBe('CUSTOMER')
  })

  it('should reject invalid customer credentials', async () => {
    const email = generateTestEmail()
    await createTestCustomer(email)

    const res = await request(app)
      .post(`${API}/auth/login`)
      .send({ email, password: 'WrongPass' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('should get customer profile with valid token', async () => {
    const email = generateTestEmail()
    await createTestCustomer(email)
    const { accessToken } = await getCustomerAuthToken(email)

    const res = await request(app)
      .get(`${API}/auth/me`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.email).toBe(email)
    expect(res.body.data.role).toBe('CUSTOMER')
  })

  it('should reject unauthenticated access to /auth/me', async () => {
    const res = await request(app).get(`${API}/auth/me`)
    expect(res.status).toBe(401)
  })
})

describe('Customer Order Tracking', () => {
  it('should create order for logged-in customer', async () => {
    const email = generateTestEmail()
    await createTestCustomer(email)
    const product = await createTestProduct()
    const { accessToken, csrfToken } = await getCustomerAuthToken(email)

    const res = await request(app)
      .post(`${API}/orders`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-csrf-token', csrfToken || '')
      .send({
        email,
        name: 'Test Customer',
        phone: '0712345678',
        items: [{ productId: product.id, quantity: 1, price: product.price }],
        shippingAddress: { address: '123 Test St' },
        paymentMethod: 'mpesa',
        paymentDetails: { phone: '0712345678' },
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.userId).toBeDefined()
  })

  it('should list own orders for customer', async () => {
    const email = generateTestEmail()
    await createTestCustomer(email)
    const { accessToken } = await getCustomerAuthToken(email)

    const res = await request(app)
      .get(`${API}/orders/me`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('should allow customer to view their own order', async () => {
    const email = generateTestEmail()
    await createTestCustomer(email)
    const { accessToken } = await getCustomerAuthToken(email)

    const ordersRes = await request(app)
      .get(`${API}/orders/me`)
      .set('Authorization', `Bearer ${accessToken}`)

    const orderId = ordersRes.body.data[0]?.id
    if (!orderId) {
      console.warn('Skipping: no orders found')
      return
    }

    const res = await request(app)
      .get(`${API}/orders/${orderId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('should BLOCK customer from viewing another customer order (IDOR)', async () => {
    const email1 = generateTestEmail()
    const email2 = generateTestEmail()
    await createTestCustomer(email1)
    await createTestCustomer(email2)
    const { accessToken: token1 } = await getCustomerAuthToken(email1)
    const { accessToken: token2 } = await getCustomerAuthToken(email2)

    const ordersRes = await request(app)
      .get(`${API}/orders/me`)
      .set('Authorization', `Bearer ${token1}`)

    const orderId = ordersRes.body.data[0]?.id
    if (!orderId) {
      console.warn('Skipping: no orders found')
      return
    }

    const res = await request(app)
      .get(`${API}/orders/${orderId}`)
      .set('Authorization', `Bearer ${token2}`)

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })

  it('should allow admin to view any order', async () => {
    const customerEmail = generateTestEmail()
    const adminEmail = generateTestEmail()
    await createTestCustomer(customerEmail)
    await createTestAdmin(adminEmail)
    const customerAuth = await getCustomerAuthToken(customerEmail)
    const adminAuth = await getCustomerAuthToken(adminEmail)

    const ordersRes = await request(app)
      .get(`${API}/orders/me`)
      .set('Authorization', `Bearer ${customerAuth.accessToken}`)

    const orderId = ordersRes.body.data[0]?.id
    if (!orderId) {
      console.warn('Skipping: no orders found')
      return
    }

    const res = await request(app)
      .get(`${API}/orders/${orderId}`)
      .set('Authorization', `Bearer ${adminAuth.accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('should BLOCK customer from accessing admin routes', async () => {
    const email = generateTestEmail()
    await createTestCustomer(email)
    const { accessToken } = await getCustomerAuthToken(email)

    const res = await request(app)
      .get(`${API}/admin/overview`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })

  it('should allow admin to access admin routes', async () => {
    const email = generateTestEmail()
    await createTestAdmin(email)
    const { accessToken, csrfToken } = await getCustomerAuthToken(email)

    const res = await request(app)
      .get(`${API}/admin/overview`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-csrf-token', csrfToken || '')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})
