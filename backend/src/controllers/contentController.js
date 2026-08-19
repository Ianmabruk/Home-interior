import { asyncHandler } from '../middleware/asyncHandler.js'
import { homepageService } from '../services/homepageService.js'
import { sendNewsletterNotificationEmail } from '../services/emailService.js'
import { prisma } from '../config/database.js'

export const contentController = {
  homepage: asyncHandler(async (req, res) => {
    const data = await homepageService.getHomepage()
    res.json({ success: true, data })
  }),

  newsletter: asyncHandler(async (req, res) => {
    const { email } = req.body

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required' })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const existing = await prisma.siteSetting.findUnique({
      where: { key: `newsletter:${normalizedEmail}` },
    })

    await prisma.siteSetting.upsert({
      where: { key: `newsletter:${normalizedEmail}` },
      update: { value: normalizedEmail },
      create: { key: `newsletter:${normalizedEmail}`, value: normalizedEmail },
    })

    if (!existing) {
      const supportEmailSetting = await prisma.siteSetting.findUnique({
        where: { key: 'supportEmail' },
      })
      const recipientEmail = (process.env.SUPPORT_EMAIL || supportEmailSetting?.value || 'info@hokinteriors.co.ke').trim()

      const siteNameSetting = await prisma.siteSetting.findUnique({
        where: { key: 'siteName' },
      })
      const siteName = siteNameSetting?.value || 'HOK Interiors'

      sendNewsletterNotificationEmail({
        subscriberEmail: normalizedEmail,
        siteName,
        supportEmail: recipientEmail,
      }).catch((err) => {
        console.error('[newsletter] Failed to send notification email:', err?.message || err)
      })
    }

    res.json({ success: true, data: { message: 'Subscribed successfully' } })
  }),
}
