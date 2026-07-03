import { z } from 'zod'
import { NewsletterSubscription } from '../models/NewsletterSubscription.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const newsletterSchema = z.object({
  email: z.string().email(),
})

export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const { email } = newsletterSchema.parse(req.body)

  const exists = await NewsletterSubscription.findOne({ email })
  if (exists) {
    return res.status(200).json({ message: 'Already subscribed' })
  }

  await NewsletterSubscription.create({ email })
  res.status(201).json({ message: 'Subscribed successfully' })
})