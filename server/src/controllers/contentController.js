import { asyncHandler } from '../utils/asyncHandler.js'
import { prisma } from '../config/prisma.js'
import { ApiError } from '../utils/ApiError.js'
import { mediaService } from '../services/media.service.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray, parseMaybeJson, parseListField, parseMediaSettings, DEFAULT_MEDIA_SETTINGS } from '../utils/helpers.js'

export const getAbout = async (req, res) => {
  const about = await prisma.about.findFirst({ orderBy: { createdAt: 'desc' } })
  res.json(sendSuccess(about ? withId(about) : null))
}

export const upsertAbout = async (req, res) => {
  const payload = {}
  const allowed = new Set(['aboutImageUrl', 'aboutImagePublicId', 'story', 'companyDescription', 'mission', 'vision', 'values', 'location', 'contactEmail', 'socials', 'mediaSettings'])
  for (const key of Object.keys(req.body)) {
    if (allowed.has(key)) payload[key] = req.body[key]
  }

  const parsedSocials = parseMaybeJson(req.body.socials, null)
  if (parsedSocials) payload.socials = parsedSocials

  const parsedMediaSettings = parseMediaSettings(req.body.mediaSettings)
  if (parsedMediaSettings) payload.mediaSettings = parsedMediaSettings

  if (req.file) {
    const upload = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder: 'hok/about', type: 'image' })
    payload.aboutImageUrl = upload.secure_url
    payload.aboutImagePublicId = upload.public_id
  }

  const existing = await prisma.about.findFirst()
  if (!existing) {
    const created = await prisma.about.create({
      data: {
        story: payload.story ?? '',
        companyDescription: payload.companyDescription ?? '',
        mission: payload.mission ?? '',
        vision: payload.vision ?? '',
        location: payload.location ?? '',
        contactEmail: payload.contactEmail ?? '',
        socials: payload.socials ?? {},
        ...payload,
      },
    })
    return res.status(201).json(sendSuccess(withId(created)))
  }

  if (payload.aboutImagePublicId && existing.aboutImagePublicId && payload.aboutImagePublicId !== existing.aboutImagePublicId) {
    try {
      await mediaService.delete(existing.aboutImagePublicId, 'image')
    } catch {
      // ignore delete failures
    }
  }

  const updated = await prisma.about.update({
    where: { id: existing.id },
    data: {
      ...payload,
      socials: payload.socials ?? existing.socials ?? {},
    },
  })
  res.json(sendSuccess(withId(updated)))
}

export const homepageFeed = asyncHandler(async (req, res) => {
  const [portfolio, virtualDesigns, services, about, testimonials, heroMedia] = await Promise.all([
    prisma.portfolio.findMany({ orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }], take: 12 }),
    prisma.virtualDesign.findMany({ orderBy: { createdAt: 'desc' }, take: 12 }),
    prisma.service.findMany({ where: { isActive: true }, orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }], take: 8 }),
    prisma.about.findFirst({ orderBy: { createdAt: 'desc' } }),
    prisma.testimonial.findMany({ where: { isActive: true }, orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }], take: 10 }),
    prisma.heroMedia.findMany({ where: { isActive: true }, orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }] }),
  ])

  const sortByOrderThenDate = (items) => items.sort((a, b) => {
    const orderDiff = (a.displayOrder || 0) - (b.displayOrder || 0)
    if (orderDiff !== 0) return orderDiff
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  const sortedPortfolio = sortByOrderThenDate([...portfolio])
  const sortedVirtualDesigns = sortByOrderThenDate([...virtualDesigns])
  const sortedServices = sortByOrderThenDate([...services])
  const sortedTestimonials = sortByOrderThenDate([...testimonials])

  const featuredPortfolio = sortedPortfolio.filter(item => item.featured).slice(0, 3)
  const featuredVirtualDesigns = sortedVirtualDesigns.filter(item => item.featured).slice(0, 3)
  const featuredProject = featuredPortfolio.length > 0 ? featuredPortfolio[0] : (sortedPortfolio.length > 0 ? sortedPortfolio[0] : null)

  const heroImages = heroMedia.map(item => ({ ...withId(item), url: item.imageUrl, imageUrl: item.imageUrl }))

  res.json(sendSuccess({
    portfolio: withIdArray(sortedPortfolio),
    virtualDesigns: withIdArray(sortedVirtualDesigns),
    virtualInteriorDesign: withIdArray(sortedVirtualDesigns),
    services: withIdArray(sortedServices),
    about: withId(about),
    testimonials: withIdArray(sortedTestimonials),
    featuredPortfolio: withIdArray(featuredPortfolio),
    featuredVirtualDesigns: withIdArray(featuredVirtualDesigns),
    heroImages,
    heroMedia: withIdArray(heroMedia),
    featuredProject: featuredProject ? withId(featuredProject) : null,
  }))
})

export const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await prisma.analytics.findMany({ orderBy: { date: 'asc' } })
  res.json(sendSuccess(withIdArray(analytics)))
})

export const testUpload = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded', received: req.files || req.body })
  }
  const result = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder: 'hok/test-uploads', type: 'image' })
  res.status(200).json(sendSuccess({
    message: 'Upload successful',
    file: {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: result.secure_url,
      publicId: result.public_id,
    },
  }))
})

export const uploadMediaController = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' })
  }
  const folder = typeof req.body.folder === 'string' && req.body.folder.trim() ? req.body.folder.trim() : 'hok/uploads'
  const kind = req.body.resourceType === 'video' ? 'video' : 'image'
  const result = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder, type: kind })
  res.status(200).json(sendSuccess({
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: kind,
  }))
})

export const deleteMediaController = asyncHandler(async (req, res) => {
  const { publicId, resourceType } = req.body
  if (!publicId) {
    return res.status(400).json({ message: 'publicId is required' })
  }
  const result = await mediaService.delete(publicId, resourceType === 'video' ? 'video' : 'image')
  res.json(sendSuccess({ result: result?.result || 'ok' }))
})

export const upsertHomepageContent = asyncHandler(async (req, res) => {
  const payload = {}
  if (req.body.title !== undefined) payload.title = req.body.title
  if (req.body.subtitle !== undefined) payload.subtitle = req.body.subtitle

  const uploadedImages = []
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/homepage/hero', type: 'image' })
      uploadedImages.push(upload.secure_url)
    }
  }
  if (uploadedImages.length > 0) {
    payload.heroImages = uploadedImages
  }

  const existing = await prisma.homepageContent.findFirst({ orderBy: { createdAt: 'desc' } })
  if (!existing) {
    const created = await prisma.homepageContent.create({ data: payload })
    return res.status(201).json(sendSuccess(withId(created)))
  }

  if (payload.heroImages && existing.heroImages) {
    const toDelete = existing.heroImages.filter(url => !payload.heroImages.includes(url))
    for (const url of toDelete) {
      try {
        const publicId = url.split('/').pop()?.split('.')[0]
        if (publicId) {
          await mediaService.delete(publicId, 'image')
        }
      } catch {
        // ignore delete failures
      }
    }
  }

  const updated = await prisma.homepageContent.update({ where: { id: existing.id }, data: payload })
  res.json(sendSuccess(withId(updated)))
})

export const deleteHeroImagesController = asyncHandler(async (req, res) => {
  const { heroImages } = req.body
  if (!Array.isArray(heroImages) || heroImages.length === 0) {
    return res.status(400).json({ success: false, message: 'heroImages array is required' })
  }

  const existing = await prisma.homepageContent.findFirst({ orderBy: { createdAt: 'desc' } })
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Homepage content not found' })
  }

  for (const url of heroImages) {
    try {
      const publicId = url.split('/').pop()?.split('.')[0]
      if (publicId) {
        await mediaService.delete(publicId, 'image')
      }
    } catch {
      // ignore delete failures
    }
  }

  const updatedHeroImages = existing.heroImages.filter(url => !heroImages.includes(url))
  const updated = await prisma.homepageContent.update({ where: { id: existing.id }, data: { heroImages: updatedHeroImages } })
  res.json(sendSuccess(withId(updated)))
})
