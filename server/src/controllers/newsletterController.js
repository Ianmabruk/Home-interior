import { z } from 'zod'
import { prisma } from '../config/db.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { parseBody } from '../utils/helpers.js'
import { prismaSafeWrite } from '../utils/prismaSafeWrite.js'

const newsletterSchema = z.object({
  email: z.string().email(),
})

export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const { email } = parseBody(newsletterSchema, req.body)

  const exists = await prisma.newsletterSubscription.findFirst({ where: { email } })
  if (exists) {
    return res.status(200).json(sendSuccess({ message: 'Already subscribed' }))
  }

  await prismaSafeWrite(
    (data) => prisma.newsletterSubscription.create({ data }),
    { email },
    'NEWSLETTER][SUBSCRIBE',
  )
  res.status(201).json(sendSuccess({ message: 'Subscribed successfully' }))
})

export const listNewsletterAdmin = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500)
  const items = await prisma.newsletterSubscription.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  res.json(sendSuccess(items.map((n) => ({ ...n, _id: n.id }))))
})

export const deleteNewsletter = asyncHandler(async (req, res) => {
  const existing = await prisma.newsletterSubscription.findUnique({ where: { id: req.params.id } })
  if (!existing) throw new ApiError(404, 'Subscriber not found')
  await prisma.newsletterSubscription.delete({ where: { id: req.params.id } })
  res.json(sendSuccess({ message: 'Subscriber removed' }))
})

export const newsletterController = {
  subscribeNewsletter,
  listNewsletterAdmin,
  deleteNewsletter,
}
