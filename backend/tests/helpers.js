import request from 'supertest'
import { prisma } from '../src/config/database.js'
import { getApp } from './lazyApp.js'
import bcrypt from 'bcryptjs'

export function generateTestEmail() {
  return `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.com`
}

export async function createTestAdmin(email, role = 'ADMIN') {
  const rounds = process.env.NODE_ENV === 'test' ? 4 : 12
  const passwordHash = await bcrypt.hash('TestPass123!', rounds)
  return prisma.admin.create({
    data: { email, fullName: 'Test Admin', passwordHash, role },
    select: { id: true, email: true, fullName: true, role: true },
  })
}

export async function getAuthToken(email, password = 'TestPass123!') {
  const app = await getApp()
  const res = await request(app).post('/api/auth/login').send({ email, password })
  return {
    accessToken: res.body?.data?.accessToken || null,
    csrfToken: res.body?.data?.csrfToken || null,
  }
}
