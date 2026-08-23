import { asyncHandler } from '../middleware/asyncHandler.js'
import { homepageService } from '../services/homepageService.js'
import { sendNewsletterNotificationEmail, sendMailingListWelcomeEmail } from '../services/emailService.js'
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

    const existing = await prisma.subscriber.findUnique({
      where: { email: normalizedEmail },
    })

    let subscriber = await prisma.subscriber.upsert({
      where: { email: normalizedEmail },
      update: { subscribed: true },
      create: {
        email: normalizedEmail,
        subscribed: true,
        unsubscribeToken: crypto
          .randomUUID()
          .replace(/-/g, '')
          .slice(0, 12),
      },
    })

    // Mailing-list welcome email to the subscriber (first subscribe or re-subscribe).
    if (!existing || existing.subscribed === false) {
      sendMailingListWelcomeEmail({
        subscriberEmail: normalizedEmail,
        unsubscribeToken: subscriber.unsubscribeToken,
      }).catch((err) => {
        console.error('[newsletter] Failed to send welcome email:', err?.message || err)
      })
    }

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

  unsubscribe: asyncHandler(async (req, res) => {
    const { token } = req.query
    const normalizedToken = String(token || '').trim()
    if (!normalizedToken) {
      return res.status(400).json({ success: false, message: 'Unsubscribe token is required' })
    }

    const subscriber = await prisma.subscriber.findUnique({
      where: { unsubscribeToken: normalizedToken },
    })

    if (!subscriber) {
      // Do not reveal whether a token exists (avoid enumeration).
      return res.json({ success: true, data: { message: 'Subscription preferences updated' } })
    }

    await prisma.subscriber.update({
      where: { unsubscribeToken: normalizedToken },
      data: { subscribed: false, updatedAt: new Date() },
    })

    res.json({ success: true, data: { message: 'You have been unsubscribed from marketing emails' } })
  }),
}
