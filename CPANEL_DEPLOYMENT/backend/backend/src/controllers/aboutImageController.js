import { asyncHandler } from '../middleware/asyncHandler.js'
import { aboutImageService } from '../services/aboutImageService.js'
import { failure } from '../utils/response.js'
import { prisma } from '../config/database.js'

export const aboutImageController = {
  list: asyncHandler(async (req, res) => {
    const about = await prisma.about.findFirst({ orderBy: { createdAt: 'desc' } })
    if (!about) {
      return res.json({ success: true, data: [] })
    }
    const items = await aboutImageService.getAboutImages(about.id)
    res.json({ success: true, data: items })
  }),

  create: asyncHandler(async (req, res) => {
    let about = await prisma.about.findFirst({ orderBy: { createdAt: 'desc' } })
    if (!about) {
      about = await prisma.about.create({
        data: {
          title: 'About Us',
          story: '',
          mission: '',
          vision: '',
          values: '',
          companyDesc: '',
          location: '',
          contactEmail: '',
          socials: '{}',
        },
      })
    }
    const file = req.file || req.files?.image?.[0] || null
    const displayOrder = req.body.displayOrder ? Number(req.body.displayOrder) : 0
    const item = await aboutImageService.createAboutImage(about.id, file, displayOrder)
    res.status(201).json({ success: true, data: item })
  }),

  update: asyncHandler(async (req, res) => {
    const { id } = req.params
    const file = req.file || req.files?.image?.[0] || null
    const data = {}
    if (req.body.displayOrder !== undefined) data.displayOrder = Number(req.body.displayOrder)
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive === 'true' || req.body.isActive === true
    const item = await aboutImageService.updateAboutImage(id, data, file)
    res.json({ success: true, data: item })
  }),

  delete: asyncHandler(async (req, res) => {
    const { id } = req.params
    await aboutImageService.deleteAboutImage(id)
    res.json({ success: true, data: { id } })
  }),

  reorder: asyncHandler(async (req, res) => {
    const about = await prisma.about.findFirst({ orderBy: { createdAt: 'desc' } })
    if (!about) {
      return res.status(400).json({ success: false, message: 'No about record found' })
    }
    const orders = req.body.orders || req.body
    const items = await aboutImageService.reorderAboutImages(about.id, orders)
    res.json({ success: true, data: items })
  }),
}
