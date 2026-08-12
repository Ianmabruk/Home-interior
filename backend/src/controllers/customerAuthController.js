import { asyncHandler } from '../middleware/asyncHandler.js'
import { customerAuthService } from '../services/customerAuthService.js'
import { failure } from '../utils/response.js'

export const customerAuthController = {
  register: asyncHandler(async (req, res) => {
    const { email, password, fullName, phone } = req.body

    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' })
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })
    }

    const user = await customerAuthService.register({ email, password, fullName, phone })
    res.status(201).json({ success: true, data: user })
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' })
    }

    const result = await customerAuthService.login(email, password)
    res.json({ success: true, data: result })
  }),

  refresh: asyncHandler(async (req, res) => {
    const refreshToken = req.body.refreshToken || req.headers['x-refresh-token']
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' })
    }
    const result = await customerAuthService.refresh(refreshToken)
    res.json({ success: true, data: result })
  }),

  logout: asyncHandler(async (req, res) => {
    const refreshToken = req.body.refreshToken || req.headers['x-refresh-token']
    await customerAuthService.logout(refreshToken)
    res.json({ success: true, data: { message: 'Logged out successfully' } })
  }),

  me: asyncHandler(async (req, res) => {
    const user = await customerAuthService.me(req.user.id)
    res.json({ success: true, data: user })
  }),
}
