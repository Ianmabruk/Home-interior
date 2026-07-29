import jwt from 'jsonwebtoken'
import { prisma } from '../config/database.js'
import { ApiError } from '../utils/ApiError.js'
import { env } from '../config/env.js'

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
    if (err instanceof ApiError) {
      return res.status(err.status).json({ success: false, message: err.message })
    }
    if ([401, 403].includes(err?.status)) {
      return res.status(err.status).json({ success: false, message: err?.message || 'Unauthorized' })
    }
    if (err?.name === 'TokenExpiredError' || err?.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token expired or invalid' })
    }
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
