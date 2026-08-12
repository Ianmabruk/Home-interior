import { asyncHandler } from '../middleware/asyncHandler.js'
import { homepageService } from '../services/homepageService.js'
import { prisma } from '../config/database.js'

export const contentController = {
  homepage: asyncHandler(async (req, res) => {
    const data = await homepageService.getHomepage()
    res.json({ success: true, data })
  }),

  newsletter: asyncHandler(async (req, res) => {
    const { email } = req.body
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email is required' })
    }
    await prisma.siteSetting.upsert({
      where: { key: `newsletter:${email}` },
      update: { value: email },
      create: { key: `newsletter:${email}`, value: email },
    })
    res.json({ success: true, data: { message: 'Subscribed successfully' } })
  }),
}
