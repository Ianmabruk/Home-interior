import jwt from 'jsonwebtoken'
import { prisma } from '../config/database.js'
import { ApiError } from '../utils/ApiError.js'
import { env } from '../config/env.js'

const SERVER_ID = process.env.SERVER_ID || 'hok-api-01'

export async function authenticate(req, res, next) {
  try {
    if (req.admin) return next()

    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Missing or invalid authorization header')
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, env.jwtAccessSecret)

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
      select: { id: true, email: true, fullName: true, role: true },
    })

    if (!admin) {
      throw new ApiError(401, 'Admin not found')
    }

    req.admin = admin
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

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return next()

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, env.jwtAccessSecret)

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
      select: { id: true, email: true, fullName: true, role: true },
    })

    if (admin) req.admin = admin
    next()
  } catch {
    next()
  }
}
