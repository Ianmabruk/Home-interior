import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma, withRetry } from '../config/database.js'
import { failure } from '../utils/response.js'
import { env } from '../config/env.js'

export const customerAuthService = {
  register,
  login,
  refresh,
  logout,
  me,
}

async function register({ email, password, fullName, phone }) {
  const existing = await withRetry(() => prisma.user.findUnique({
    where: { email },
    select: { id: true },
  }))
  if (existing) {
    throw failure(409, 'Email is already registered')
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await withRetry(() => prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      phone: phone || null,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
    select: { id: true, email: true, fullName: true, phone: true, role: true, status: true, createdAt: true },
  }))

  return user
}

async function login(email, password) {
  const user = await withRetry(() => prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true, fullName: true, phone: true, role: true, status: true },
  }))

  if (!user) {
    throw failure(401, 'Invalid email or password')
  }

  if (user.status !== 'ACTIVE') {
    throw failure(401, 'Account is not active')
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    throw failure(401, 'Invalid email or password')
  }

  const payload = { userId: user.id, email: user.email, role: user.role }
  const accessToken = jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.accessTokenTtl || '15m' })
  const refreshToken = jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.refreshTokenTtl || '30d' })

  // Store refresh token asynchronously - not critical for login success
  setImmediate(() => {
    prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }).catch(() => {})
  })

  return {
    user: { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone, role: user.role },
    accessToken,
    refreshToken,
  }
}

async function refresh(refreshToken) {
  if (!refreshToken) throw failure(401, 'No refresh token')

  let decoded
  try {
    decoded = jwt.verify(refreshToken, env.jwtRefreshSecret)
  } catch {
    throw failure(401, 'Invalid refresh token')
  }

  if (!decoded.userId) {
    throw failure(401, 'Invalid refresh token')
  }

  const reset = await withRetry(() => prisma.passwordReset.findFirst({
    where: { userId: decoded.userId, token: refreshToken },
  }))

  if (!reset || new Date(reset.expiresAt) < new Date()) {
    throw failure(401, 'Invalid refresh token')
  }

  const user = await withRetry(() => prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, fullName: true, phone: true, role: true, status: true },
  }))

  if (!user || user.status !== 'ACTIVE') {
    throw failure(401, 'User not found or inactive')
  }

  const payload = { userId: user.id, email: user.email, role: user.role }
  const accessToken = jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.accessTokenTtl || '15m' })
  const newRefresh = jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.refreshTokenTtl || '30d' })

  await withRetry(() => prisma.passwordReset.update({
    where: { id: reset.id },
    data: { token: newRefresh, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  }))

  return { accessToken, refreshToken: newRefresh }
}

async function logout(refreshToken) {
  if (!refreshToken) return
  try {
    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret)
    if (decoded.userId) {
      await withRetry(() => prisma.passwordReset.deleteMany({ where: { userId: decoded.userId } })).catch(() => {})
    }
  } catch {
    // ignore
  }
}

async function me(userId) {
  const user = await withRetry(() => prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, phone: true, role: true, status: true, createdAt: true },
  }))
  if (!user) throw failure(404, 'User not found')
  return user
}
