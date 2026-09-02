import { asyncHandler } from '../middleware/asyncHandler.js'
import { failure } from '../utils/response.js'
import { authService } from '../services/authService.js'
import { customerAuthService } from '../services/customerAuthService.js'
import jwt from 'jsonwebtoken'
import { prisma, withRetry } from '../config/database.js'
import { env } from '../config/env.js'
import { generateCsrfToken } from '../middleware/csrf.js'
import { emailService } from '../services/emailService.js'

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
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })

    // Optional login notification (configurable; failures never block login).
    if (result.user?.email) {
      emailService.sendLoginNotification({
        userId: result.user.id || result.user._id,
        email: result.user.email,
        name: result.user.fullName || result.user.name || result.user.email,
      }).catch((e) => console.warn('[auth] login notification failed:', e?.message))
    }

    res.json({ success: true, data: { user: result.user, accessToken: result.accessToken, csrfToken } })
  }),

  register: asyncHandler(async (req, res) => {
    const t0 = Date.now()
    const { email, password, fullName, phone } = req.body
    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })
    }

    const user = await customerAuthService.register({ email, password, fullName, phone })
    const csrfToken = generateCsrfToken()

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.jwtAccessSecret,
      { expiresIn: env.accessTokenTtl || '15m' },
    )
    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.jwtRefreshSecret,
      { expiresIn: env.refreshTokenTtl || '30d' },
    )

    // Store refresh token asynchronously - not critical for signup response
    setImmediate(() => {
      withRetry(() => prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })).catch(() => {})
    })

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })

    emailService.sendWelcomeEmail({
      userId: user?.id || user?._id,
      email: user.email,
      name: user.fullName || user.name || '',
    }).catch((e) => console.warn('[auth] welcome email failed:', e?.message))

    const t1 = Date.now()
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[auth] register completed in ${t1 - t0}ms`)
    }
    res.status(201).json({ success: true, data: { user, accessToken, csrfToken } })
  }),

  refresh: asyncHandler(async (req, res) => {
    const cookieToken = req.cookies?.refreshToken
    const headerToken = req.headers['x-refresh-token']
    const authHeaderToken = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null
    const token = cookieToken || headerToken || authHeaderToken

    if (!token) {
      console.warn(`[auth] refresh rejected: no token (cookies=${!!cookieToken}, header=${!!headerToken}, bearer=${!!authHeaderToken}) from ${req.ip}`)
      return res.status(401).json({ success: false, message: 'Refresh token required' })
    }

    let result
    try {
      result = await authService.refresh(token)
    } catch (err) {
      console.warn(`[auth] refresh rejected for admin: ${err?.message || err}`)
      try {
        result = await customerAuthService.refresh(token)
      } catch (custErr) {
        console.warn(`[auth] refresh rejected for customer: ${custErr?.message || custErr}`)
        return res.status(401).json({ success: false, message: 'Invalid refresh token' })
      }
    }

    const csrfToken = generateCsrfToken()
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
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

  getCsrfToken: asyncHandler(async (req, res) => {
    const csrfToken = generateCsrfToken()
    res.json({ success: true, data: { csrfToken } })
  }),
}
