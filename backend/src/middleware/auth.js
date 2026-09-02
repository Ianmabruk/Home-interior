import jwt from 'jsonwebtoken'
import { prisma, withRetry } from '../config/database.js'
import { ApiError } from '../utils/ApiError.js'
import { env } from '../config/env.js'

const SERVER_ID = process.env.SERVER_ID || 'hok-api-01'

export async function authenticate(req, res, next) {
  try {
    if (req.admin) return next()
    if (req.user) return next()

    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      console.warn(`[${SERVER_ID}] [auth] missing/invalid auth header on ${req.method} ${req.originalUrl}`)
      throw new ApiError(401, 'Missing or invalid authorization header')
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, env.jwtAccessSecret)

    if (decoded.adminId) {
      const admin = await withRetry(() => prisma.admin.findUnique({
        where: { id: decoded.adminId },
        select: { id: true, email: true, fullName: true, role: true },
      }))
      if (!admin) {
        console.warn(`[${SERVER_ID}] [auth] admin not found for token`, decoded.adminId)
        throw new ApiError(401, 'Admin not found')
      }
      req.admin = admin
    } else if (decoded.userId) {
      const user = await withRetry(() => prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, fullName: true, phone: true, role: true, status: true },
      }))
      if (!user) {
        throw new ApiError(401, 'User not found')
      }
      if (user.status !== 'ACTIVE') {
        throw new ApiError(401, 'Account is not active')
      }
      req.user = user
    } else {
      throw new ApiError(401, 'Invalid token')
    }

    next()
  } catch (err) {
    res.setHeader('X-Server-ID', SERVER_ID)
    if (err instanceof ApiError) {
      console.warn(`[${SERVER_ID}] [auth] failed:`, err.message, 'status=', err.status)
      return res.status(err.status).json({ success: false, message: err.message })
    }
    if (err?.name === 'TokenExpiredError') {
      console.warn(`[${SERVER_ID}] [auth] token expired`)
      return res.status(401).json({ success: false, message: 'Token expired' })
    }
    if (err?.name === 'JsonWebTokenError') {
      console.warn(`[${SERVER_ID}] [auth] invalid token`)
      return res.status(401).json({ success: false, message: 'Invalid token' })
    }
    console.error(`[${SERVER_ID}] [auth] unexpected error:`, err)
    return res.status(500).json({ success: false, message: err?.message || 'Authentication failed' })
  }
}

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    const isAdmin = !!req.admin
    const isUser = !!req.user

    if (!isAdmin && !isUser) {
      return res.status(401).json({ success: false, message: 'Not authenticated' })
    }

    const role = req.admin?.role || req.user?.role

    if (allowedRoles.length === 0 || allowedRoles.includes(role)) {
      return next()
    }

    return res.status(403).json({ success: false, message: 'Insufficient permissions' })
  }
}

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return next()

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, env.jwtAccessSecret)

    if (decoded.adminId) {
      const admin = await withRetry(() => prisma.admin.findUnique({
        where: { id: decoded.adminId },
        select: { id: true, email: true, fullName: true, role: true },
      }))
      if (admin) req.admin = admin
    } else if (decoded.userId) {
      const user = await withRetry(() => prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, fullName: true, phone: true, role: true, status: true },
      }))
      if (user && user.status === 'ACTIVE') {
        req.user = user
      }
    }
    next()
  } catch {
    next()
  }
}
