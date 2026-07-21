import { asyncHandler } from '../utils/asyncHandler.js'
import { prisma } from '../config/prisma.js'
import { ApiError } from '../utils/ApiError.js'
import { mediaService } from '../services/media.service.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray } from '../utils/helpers.js'

export const heroMediaController = {
  list: asyncHandler(async (req, res) => {
    const items = await prisma.heroMedia.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      where: { isActive: true },
    })
    res.json(sendSuccess(withIdArray(items)))
  }),

  get: asyncHandler(async (req, res) => {
    const item = await prisma.heroMedia.findUnique({ where: { id: req.params.id } })
    if (!item) {
      return res.status(404).json({ success: false, message: 'Hero media not found' })
    }
    res.json(sendSuccess(withId(item)))
  }),

  create: asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file is required' })
    }

    const upload = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder: 'hok/homepage/hero', type: 'image' })
    const payload = {
      imageUrl: upload.secure_url,
      publicId: upload.public_id,
      mediaType: 'image',
      featured: false,
      displayOrder: 0,
      isActive: true,
    }

    if (req.body.title) payload.title = req.body.title
    if (req.body.subtitle) payload.subtitle = req.body.subtitle
    if (req.body.featured !== undefined) payload.featured = req.body.featured === 'true' || req.body.featured === true
    if (req.body.displayOrder !== undefined) payload.displayOrder = Number(req.body.displayOrder)

    const item = await prisma.heroMedia.create({ data: payload })
    res.status(201).json(sendSuccess(withId(item)))
  }),

  update: asyncHandler(async (req, res) => {
    const existing = await prisma.heroMedia.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Hero media not found' })
    }

    const payload = {}
    if (req.body.title !== undefined) payload.title = req.body.title
    if (req.body.subtitle !== undefined) payload.subtitle = req.body.subtitle
    if (req.body.featured !== undefined) payload.featured = req.body.featured === 'true' || req.body.featured === true
    if (req.body.displayOrder !== undefined) payload.displayOrder = Number(req.body.displayOrder)
    if (req.body.isActive !== undefined) payload.isActive = req.body.isActive === 'true' || req.body.isActive === true

    if (req.file) {
      if (existing.publicId) {
        try {
          await mediaService.delete(existing.publicId, 'image')
        } catch {
          // ignore
        }
      }
      const upload = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder: 'hok/homepage/hero', type: 'image' })
      payload.imageUrl = upload.secure_url
      payload.publicId = upload.public_id
    }

    const item = await prisma.heroMedia.update({ where: { id: req.params.id }, data: payload })
    res.json(sendSuccess(withId(item)))
  }),

  remove: asyncHandler(async (req, res) => {
    const existing = await prisma.heroMedia.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Hero media not found' })
    }
    if (existing.publicId) {
      try {
        await mediaService.delete(existing.publicId, 'image')
      } catch {
        // ignore
      }
    }
    await prisma.heroMedia.delete({ where: { id: req.params.id } })
    res.json(sendSuccess({ message: 'Hero media deleted' }))
  }),

  reorder: asyncHandler(async (req, res) => {
    const { order } = req.body
    if (!Array.isArray(order)) {
      return res.status(400).json({ success: false, message: 'Order must be an array of {id, displayOrder}' })
    }
    const updates = order.map((item, index) =>
      prisma.heroMedia.update({ where: { id: item.id }, data: { displayOrder: item.displayOrder ?? index } })
    )
    await prisma.$transaction(updates)
    res.json(sendSuccess({ message: 'Hero media reordered' }))
  }),
}
