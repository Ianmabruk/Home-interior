import { asyncHandler } from '../middleware/asyncHandler.js'
import { failure } from '../utils/response.js'
import { authService } from '../services/authService.js'
import { customerAuthService } from '../services/customerAuthService.js'
import bcrypt from 'bcryptjs'
import { prisma } from '../config/database.js'
import { generateCsrfToken } from '../middleware/csrf.js'

export const authController = {
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' })
    }

    let result
    try {
      result = await authService.login(email, password)
    } catch {
      try {
        result = await customerAuthService.login(email, password)
      } catch {
        return res.status(401).json({ success: false, message: 'Invalid email or password' })
      }
    }

    const csrfToken = generateCsrfToken()
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
    res.json({ success: true, data: { user: result.user, accessToken: result.accessToken, csrfToken } })
  }),

  register: asyncHandler(async (req, res) => {
    const { email, password, fullName, phone } = req.body
    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })
    }

    const user = await customerAuthService.register({ email, password, fullName, phone })
    const csrfToken = generateCsrfToken()
    res.status(201).json({ success: true, data: user })
  }),

  refresh: asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.headers['x-refresh-token']
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token required' })
    }

    let result
    try {
      result = await authService.refresh(token)
    } catch {
      try {
        result = await customerAuthService.refresh(token)
      } catch {
        return res.status(401).json({ success: false, message: 'Invalid refresh token' })
      }
    }

    const csrfToken = generateCsrfToken()
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
    res.json({ success: true, data: { accessToken: result.accessToken, csrfToken } })
  }),

  logout: asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.headers['x-refresh-token']
    try {
      await authService.logout(token)
    } catch {
      // ignore admin logout errors
    }
    try {
      await customerAuthService.logout(token)
    } catch {
      // ignore customer logout errors
    }
    res.clearCookie('refreshToken', { path: '/' })
    res.json({ success: true, data: { message: 'Logged out successfully' } })
  }),

  me: asyncHandler(async (req, res) => {
    if (req.admin) {
      const admin = await authService.me(req.admin.id)
      return res.json({ success: true, data: admin })
    }
    if (req.user) {
      const user = await customerAuthService.me(req.user.id)
      return res.json({ success: true, data: user })
    }
    return res.status(401).json({ success: false, message: 'Not authenticated' })
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const { fullName } = req.body
    if (req.admin) {
      const updated = await prisma.admin.update({
        where: { id: req.admin.id },
        data: { fullName: fullName || req.admin.fullName },
        select: { id: true, email: true, fullName: true, role: true },
      })
      return res.json({ success: true, data: updated })
    }
    if (req.user) {
      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: { fullName: fullName || req.user.fullName },
        select: { id: true, email: true, fullName: true, phone: true, role: true },
      })
      return res.json({ success: true, data: updated })
    }
    return res.status(401).json({ success: false, message: 'Not authenticated' })
  }),
}
