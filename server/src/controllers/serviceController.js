import { asyncHandler } from '../utils/asyncHandler.js'
import { prisma } from '../config/prisma.js'
import { ApiError } from '../utils/ApiError.js'
import { mediaService } from '../services/media.service.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray, sortByOrderThenDate, orderValue, toBoolean } from '../utils/helpers.js'

const stripUnknown = (obj, allowed) => {
  const out = {}
  for (const key of Object.keys(obj)) {
    if (allowed.has(key)) out[key] = obj[key]
  }
  return out
}

const findFileByFieldname = (req, fieldname) => {
  const files = Array.isArray(req.files) ? req.files : []
  return files.find((f) => f.fieldname === fieldname) || null
}

export const serviceController = {
  list: asyncHandler(async (req, res) => {
    const items = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        description: true,
        icon: true,
        imageUrl: true,
        cloudinaryId: true,
        mediaSettings: true,
        featured: true,
        displayOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    res.json(sendSuccess(withIdArray(sortByOrderThenDate(items))))
  }),

  listAdmin: asyncHandler(async (req, res) => {
    const items = await prisma.service.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        description: true,
        icon: true,
        imageUrl: true,
        cloudinaryId: true,
        mediaSettings: true,
        featured: true,
        displayOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    res.json(sendSuccess(withIdArray(sortByOrderThenDate(items))))
  }),

  get: asyncHandler(async (req, res) => {
    const item = await prisma.service.findUnique({ where: { id: req.params.id } })
    if (!item) {
      return res.status(404).json({ success: false, message: 'Service not found' })
    }
    res.json(sendSuccess(withId(item)))
  }),

  create: asyncHandler(async (req, res) => {
    const allowed = new Set(['title', 'description', 'icon', 'imageUrl', 'cloudinaryId', 'mediaSettings', 'featured', 'displayOrder', 'isActive'])
    const payload = stripUnknown({ ...req.body }, allowed)

    if (payload.displayOrder !== undefined) payload.displayOrder = orderValue(payload.displayOrder)
    payload.featured = toBoolean(req.body.featured, false)
    payload.isActive = toBoolean(req.body.isActive, true)

    const mediaFile = findFileByFieldname(req, 'media')
    if (mediaFile) {
      const upload = await mediaService.upload({ buffer: mediaFile.buffer, mimeType: mediaFile.mimetype, folder: 'hok/services', type: 'image' })
      payload.imageUrl = upload.secure_url
      payload.cloudinaryId = upload.public_id
    }

    const item = await prisma.service.create({ data: payload })
    res.status(201).json(sendSuccess(withId(item)))
  }),

  update: asyncHandler(async (req, res) => {
    const existing = await prisma.service.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service not found' })
    }

    const allowed = new Set(['title', 'description', 'icon', 'imageUrl', 'cloudinaryId', 'mediaSettings', 'featured', 'displayOrder', 'isActive'])
    const payload = stripUnknown({ ...req.body }, allowed)

    if (payload.displayOrder !== undefined) payload.displayOrder = orderValue(payload.displayOrder)
    payload.featured = toBoolean(req.body.featured, existing.featured)
    payload.isActive = toBoolean(req.body.isActive, existing.isActive)

    const mediaFile = findFileByFieldname(req, 'media')
    if (mediaFile) {
      if (existing.cloudinaryId) {
        await mediaService.delete(existing.cloudinaryId, 'image')
      }
      const upload = await mediaService.upload({ buffer: mediaFile.buffer, mimeType: mediaFile.mimetype, folder: 'hok/services', type: 'image' })
      payload.imageUrl = upload.secure_url
      payload.cloudinaryId = upload.public_id
    }

    const item = await prisma.service.update({ where: { id: req.params.id }, data: payload })
    res.json(sendSuccess(withId(item)))
  }),

  reorder: asyncHandler(async (req, res) => {
    const { order } = req.body
    if (!Array.isArray(order)) {
      return res.status(400).json({ success: false, message: 'Order must be an array of {id, displayOrder}' })
    }
    const updates = order.map((item, index) =>
      prisma.service.update({ where: { id: item.id }, data: { displayOrder: item.displayOrder ?? index } })
    )
    await prisma.$transaction(updates)
    res.json(sendSuccess({ message: 'Services reordered' }))
  }),

  remove: asyncHandler(async (req, res) => {
    const existing = await prisma.service.findUnique({ where: { id: req.params.id } })
    if (existing) {
      if (existing.cloudinaryId) {
        await mediaService.delete(existing.cloudinaryId, 'image')
      }
    }
    await prisma.service.delete({ where: { id: req.params.id } })
    res.json(sendSuccess({ message: 'Service deleted' }))
  }),
}
