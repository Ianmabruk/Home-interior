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
  if (req.file && req.file.fieldname === fieldname) return req.file
  const files = Array.isArray(req.files) ? req.files : []
  const found = files.find((f) => f.fieldname === fieldname)
  if (found) return found
  if (req.files && typeof req.files === 'object' && req.files[fieldname]) {
    const arr = req.files[fieldname]
    return Array.isArray(arr) ? arr[0] : arr
  }
  return null
}

const findFilesByFieldname = (req, fieldname) => {
  if (Array.isArray(req.files)) {
    return req.files.filter((f) => f.fieldname === fieldname)
  }
  if (req.files && typeof req.files === 'object' && req.files[fieldname]) {
    const arr = req.files[fieldname]
    return Array.isArray(arr) ? arr : [arr]
  }
  return []
}

export const portfolioController = {
  list: asyncHandler(async (req, res) => {
    const items = await prisma.portfolio.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        imageUrl: true,
        cloudinaryId: true,
        featured: true,
        displayOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    res.json(sendSuccess(withIdArray(sortByOrderThenDate(items))))
  }),

  get: asyncHandler(async (req, res) => {
    const item = await prisma.portfolio.findUnique({ where: { id: req.params.id } })
    if (!item) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' })
    }
    res.json(sendSuccess(withId(item)))
  }),

  create: asyncHandler(async (req, res) => {
    const allowed = new Set(['title', 'description', 'category', 'imageUrl', 'galleryImages', 'cloudinaryId', 'featured', 'displayOrder'])
    const payload = stripUnknown({ ...req.body }, allowed)

    if (payload.displayOrder !== undefined) payload.displayOrder = orderValue(payload.displayOrder)
    payload.featured = toBoolean(req.body.featured, false)

    const galleryFiles = findFilesByFieldname(req, 'gallery')
    const galleryUrls = []
    for (const file of galleryFiles) {
      const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/portfolio/gallery', type: 'image' })
      galleryUrls.push(upload.secure_url)
    }
    if (galleryUrls.length > 0) {
      payload.galleryImages = galleryUrls
    }

    const mediaFile = findFileByFieldname(req, 'media')
    if (mediaFile) {
      const upload = await mediaService.upload({ buffer: mediaFile.buffer, mimeType: mediaFile.mimetype, folder: 'hok/portfolio', type: 'image' })
      payload.imageUrl = upload.secure_url
      payload.cloudinaryId = upload.public_id
    }

    if (!payload.imageUrl) {
      return res.status(400).json({ success: false, message: 'Image is required' })
    }

    const item = await prisma.portfolio.create({ data: payload })
    res.status(201).json(sendSuccess(withId(item)))
  }),

  update: asyncHandler(async (req, res) => {
    const existing = await prisma.portfolio.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' })
    }

    const allowed = new Set(['title', 'description', 'category', 'imageUrl', 'galleryImages', 'cloudinaryId', 'featured', 'displayOrder'])
    const payload = stripUnknown({ ...req.body }, allowed)

    if (payload.displayOrder !== undefined) payload.displayOrder = orderValue(payload.displayOrder)
    payload.featured = toBoolean(req.body.featured, existing.featured)

    const galleryFiles = findFilesByFieldname(req, 'gallery')
    const galleryUrls = []
    for (const file of galleryFiles) {
      const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/portfolio/gallery', type: 'image' })
      galleryUrls.push(upload.secure_url)
    }
    if (galleryUrls.length > 0) {
      payload.galleryImages = [...(existing.galleryImages || []), ...galleryUrls]
    }

    const mediaFile = findFileByFieldname(req, 'media')
    if (mediaFile) {
      if (existing.cloudinaryId) {
        await mediaService.delete(existing.cloudinaryId, 'image')
      }
      const upload = await mediaService.upload({ buffer: mediaFile.buffer, mimeType: mediaFile.mimetype, folder: 'hok/portfolio', type: 'image' })
      payload.imageUrl = upload.secure_url
      payload.cloudinaryId = upload.public_id
    }

    const item = await prisma.portfolio.update({ where: { id: req.params.id }, data: payload })
    res.json(sendSuccess(withId(item)))
  }),

  reorder: asyncHandler(async (req, res) => {
    const { order } = req.body
    if (!Array.isArray(order)) {
      return res.status(400).json({ success: false, message: 'Order must be an array of {id, displayOrder}' })
    }
    const updates = order.map((item, index) =>
      prisma.portfolio.update({ where: { id: item.id }, data: { displayOrder: item.displayOrder ?? index } })
    )
    await prisma.$transaction(updates)
    res.json(sendSuccess({ message: 'Portfolio reordered' }))
  }),

  remove: asyncHandler(async (req, res) => {
    const existing = await prisma.portfolio.findUnique({ where: { id: req.params.id } })
    if (existing) {
      if (existing.cloudinaryId) {
        await mediaService.delete(existing.cloudinaryId, 'image')
      }
      if (existing.galleryImages && existing.galleryImages.length > 0) {
        for (const imageUrl of existing.galleryImages) {
          try {
            const publicId = imageUrl.split('/').pop()?.split('.')[0]
            if (publicId) {
              await mediaService.delete(publicId, 'image')
            }
          } catch {
            // ignore
          }
        }
      }
    }
    await prisma.portfolio.delete({ where: { id: req.params.id } })
    res.json(sendSuccess({ message: 'Portfolio item deleted' }))
  }),

  addGalleryImages: asyncHandler(async (req, res) => {
    const existing = await prisma.portfolio.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' })
    }

    const galleryFiles = findFilesByFieldname(req, 'gallery')
    const galleryUrls = []
    for (const file of galleryFiles) {
      const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/portfolio/gallery', type: 'image' })
      galleryUrls.push(upload.secure_url)
    }

    if (galleryUrls.length === 0) {
      return res.status(400).json({ success: false, message: 'No gallery images provided' })
    }

    const existingGallery = existing.galleryImages || []
    const updatedGallery = [...existingGallery, ...galleryUrls]
    const item = await prisma.portfolio.update({ where: { id: req.params.id }, data: { galleryImages: updatedGallery } })
    res.json(sendSuccess(withId(item)))
  }),

  removeGalleryImage: asyncHandler(async (req, res) => {
    const { imageUrl } = req.body
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'imageUrl is required' })
    }

    const existing = await prisma.portfolio.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' })
    }

    const existingGallery = existing.galleryImages || []
    const updatedGallery = existingGallery.filter(url => url !== imageUrl)

    if (updatedGallery.length === existingGallery.length) {
      return res.status(404).json({ success: false, message: 'Image not found in gallery' })
    }

    try {
      const publicId = imageUrl.split('/').pop()?.split('.')[0]
      if (publicId) {
        await mediaService.delete(publicId, 'image')
      }
    } catch {
      // ignore
    }

    const item = await prisma.portfolio.update({ where: { id: req.params.id }, data: { galleryImages: updatedGallery } })
    res.json(sendSuccess(withId(item)))
  }),
}
