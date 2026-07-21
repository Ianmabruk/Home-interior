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

export const virtualDesignController = {
  list: asyncHandler(async (req, res) => {
    const items = await prisma.virtualDesign.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        mediaType: true,
        mediaUrl: true,
        cloudinaryId: true,
        featured: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    res.json(sendSuccess(withIdArray(sortByOrderThenDate(items))))
  }),

  get: asyncHandler(async (req, res) => {
    const item = await prisma.virtualDesign.findUnique({ where: { id: req.params.id } })
    if (!item) {
      return res.status(404).json({ success: false, message: 'Virtual Design item not found' })
    }
    res.json(sendSuccess(withId(item)))
  }),

  create: asyncHandler(async (req, res) => {
    const allowed = new Set(['title', 'description', 'category', 'mediaType', 'mediaUrl', 'galleryMedia', 'cloudinaryId', 'featured'])
    const payload = stripUnknown({ ...req.body }, allowed)
    payload.featured = toBoolean(req.body.featured, false)

    const isVideo = req.body.mediaType === 'video' || req.body.resourceType === 'video'

    const mediaFile = findFileByFieldname(req, 'media')
    if (mediaFile) {
      const upload = await mediaService.upload({ buffer: mediaFile.buffer, mimeType: mediaFile.mimetype, folder: 'hok/virtual-design', type: isVideo ? 'video' : 'image' })
      payload.mediaUrl = upload.secure_url
      payload.cloudinaryId = upload.public_id
      payload.mediaType = isVideo ? 'video' : 'image'
    }

    const galleryFiles = findFilesByFieldname(req, 'gallery')
    const galleryUrls = []
    for (const file of galleryFiles) {
      const isVideoFile = file.mimetype.startsWith('video/')
      const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/virtual-design/gallery', type: isVideoFile ? 'video' : 'image' })
      galleryUrls.push({ url: upload.secure_url, type: isVideoFile ? 'video' : 'image' })
    }
    if (galleryUrls.length > 0) {
      payload.galleryMedia = galleryUrls
    }

    if (!payload.mediaUrl) {
      payload.mediaUrl = 'https://via.placeholder.com/800x600?text=No+Image'
      payload.cloudinaryId = null
      payload.mediaType = payload.mediaType || 'image'
    }

    if (!payload.mediaType) {
      payload.mediaType = isVideo ? 'video' : 'image'
    }

    const item = await prisma.virtualDesign.create({ data: payload })
    res.status(201).json(sendSuccess(withId(item)))
  }),

  update: asyncHandler(async (req, res) => {
    const existing = await prisma.virtualDesign.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Virtual Design item not found' })
    }

    const allowed = new Set(['title', 'description', 'category', 'mediaType', 'mediaUrl', 'galleryMedia', 'cloudinaryId', 'featured'])
    const payload = stripUnknown({ ...req.body }, allowed)
    payload.featured = toBoolean(req.body.featured, existing.featured)

    const isVideo = req.body.mediaType === 'video' || req.body.resourceType === 'video'

    const mediaFile = findFileByFieldname(req, 'media')
    if (mediaFile) {
      if (existing.cloudinaryId) {
        await mediaService.delete(existing.cloudinaryId, existing.mediaType === 'video' ? 'video' : 'image')
      }
      const upload = await mediaService.upload({ buffer: mediaFile.buffer, mimeType: mediaFile.mimetype, folder: 'hok/virtual-design', type: isVideo ? 'video' : 'image' })
      payload.mediaUrl = upload.secure_url
      payload.cloudinaryId = upload.public_id
      payload.mediaType = isVideo ? 'video' : 'image'
    }

    const galleryFiles = findFilesByFieldname(req, 'gallery')
    const galleryUrls = []
    for (const file of galleryFiles) {
      const isVideoFile = file.mimetype.startsWith('video/')
      const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/virtual-design/gallery', type: isVideoFile ? 'video' : 'image' })
      galleryUrls.push({ url: upload.secure_url, type: isVideoFile ? 'video' : 'image' })
    }
    if (galleryUrls.length > 0) {
      payload.galleryMedia = [...(existing.galleryMedia || []), ...galleryUrls]
    }

    const item = await prisma.virtualDesign.update({ where: { id: req.params.id }, data: payload })
    res.json(sendSuccess(withId(item)))
  }),

  remove: asyncHandler(async (req, res) => {
    const existing = await prisma.virtualDesign.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Virtual Design item not found' })
    }

    if (existing.cloudinaryId) {
      try {
        await mediaService.delete(existing.cloudinaryId, existing.mediaType === 'video' ? 'video' : 'image')
      } catch {
        // ignore
      }
    }
    if (existing.galleryMedia && existing.galleryMedia.length > 0) {
      for (const media of existing.galleryMedia) {
        try {
          const publicId = media.url.split('/').pop()?.split('.')[0]
          if (publicId) {
            await mediaService.delete(publicId, media.type === 'video' ? 'video' : 'image')
          }
        } catch {
          // ignore
        }
      }
    }

    await prisma.virtualDesign.delete({ where: { id: req.params.id } })
    res.json(sendSuccess({ message: 'Virtual Design item deleted' }))
  }),

  addGalleryMedia: asyncHandler(async (req, res) => {
    const existing = await prisma.virtualDesign.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Virtual Design item not found' })
    }

    const galleryFiles = findFilesByFieldname(req, 'gallery')
    const galleryUrls = []
    for (const file of galleryFiles) {
      const isVideoFile = file.mimetype.startsWith('video/')
      const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/virtual-design/gallery', type: isVideoFile ? 'video' : 'image' })
      galleryUrls.push({ url: upload.secure_url, type: isVideoFile ? 'video' : 'image' })
    }

    if (galleryUrls.length === 0) {
      return res.status(400).json({ success: false, message: 'No gallery media provided' })
    }

    const existingGallery = existing.galleryMedia || []
    const updatedGallery = [...existingGallery, ...galleryUrls]
    const item = await prisma.virtualDesign.update({ where: { id: req.params.id }, data: { galleryMedia: updatedGallery } })
    res.json(sendSuccess(withId(item)))
  }),

  removeGalleryMedia: asyncHandler(async (req, res) => {
    const { mediaUrl } = req.body
    if (!mediaUrl) {
      return res.status(400).json({ success: false, message: 'mediaUrl is required' })
    }

    const existing = await prisma.virtualDesign.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Virtual Design item not found' })
    }

    const existingGallery = existing.galleryMedia || []
    const updatedGallery = existingGallery.filter(media => media.url !== mediaUrl)

    if (updatedGallery.length === existingGallery.length) {
      return res.status(404).json({ success: false, message: 'Media not found in gallery' })
    }

    try {
      const publicId = mediaUrl.split('/').pop()?.split('.')[0]
      if (publicId) {
        const media = existingGallery.find(m => m.url === mediaUrl)
        await mediaService.delete(publicId, media?.type === 'video' ? 'video' : 'image')
      }
    } catch {
      // ignore
    }

    if (updatedGallery.length === 0) {
      await prisma.$executeRaw`UPDATE virtual_designs SET gallery_media = ${'[]'}::jsonb WHERE _id = ${req.params.id}`
      const item = await prisma.virtualDesign.findUnique({ where: { id: req.params.id } })
      return res.json(sendSuccess(withId(item)))
    }

    const item = await prisma.virtualDesign.update({ where: { id: req.params.id }, data: { galleryMedia: updatedGallery } })
    res.json(sendSuccess(withId(item)))
  }),
}
