import request from 'supertest'
import { prisma } from '../src/config/database.js'
import { getApp } from './lazyApp.js'
import { generateTestEmail, createTestAdmin, getAuthToken } from './helpers.js'

describe('Admin overview', () => {
  it('should calculate revenue from confirmed sales only', async () => {
    const app = await getApp()
    const adminEmail = generateTestEmail()
    await createTestAdmin(adminEmail)
    const { accessToken, csrfToken } = await getAuthToken(adminEmail)

    await prisma.order.createMany({
      data: [
        {
          email: generateTestEmail(),
          name: 'Pending order',
          items: '[]',
          shippingAddress: '{}',
          paymentMethod: 'mpesa',
          paymentDetails: '{}',
          paymentStatus: 'pending',
          total: 15000,
          status: 'pending',
        },
        {
          email: generateTestEmail(),
          name: 'Refunded order',
          items: '[]',
          shippingAddress: '{}',
          paymentMethod: 'mpesa',
          paymentDetails: '{}',
          paymentStatus: 'rejected',
          total: 18000,
          status: 'refunded',
        },
        {
          email: generateTestEmail(),
          name: 'Confirmed sale',
          items: '[]',
          shippingAddress: '{}',
          paymentMethod: 'mpesa',
          paymentDetails: '{}',
          paymentStatus: 'confirmed',
          total: 25000,
          status: 'completed',
        },
      ],
    })

    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-csrf-token', csrfToken || '')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Number(res.body.data.revenue)).toBe(25000)
  })
})
