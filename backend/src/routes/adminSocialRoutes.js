import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { prisma } from '../config/database.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

const router = Router()

// Get social links (public)
router.get('/', asyncHandler(async (req, res) => {
  try {
    const about = await prisma.about.findFirst({ orderBy: { createdAt: 'desc' } })
    const socials = about?.socials ? (typeof about.socials === 'string' ? JSON.parse(about.socials) : about.socials) : {}
    res.json({ success: true, data: socials })
  } catch {
    res.json({ success: true, data: {} })
  }
}))

// Update social links (admin)
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { tiktok, instagram, facebook, pinterest } = req.body
  
  const about = await prisma.about.findFirst({ orderBy: { createdAt: 'desc' } })
  
  const socials = {
    tiktok: tiktok || '',
    instagram: instagram || '',
    facebook: facebook || '',
    pinterest: pinterest || '',
  }

  let result
  if (about) {
    result = await prisma.about.update({
      where: { id: about.id },
      data: { socials: JSON.stringify(socials) }
    })
  } else {
    result = await prisma.about.create({
      data: { socials: JSON.stringify(socials) }
    })
  }

  const savedSocials = result.socials ? (typeof result.socials === 'string' ? JSON.parse(result.socials) : result.socials) : {}
  res.json({ success: true, data: savedSocials })
}))

export default router