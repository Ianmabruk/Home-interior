import { asyncHandler } from '../middleware/asyncHandler.js'
import { virtualDesignService } from '../services/virtualDesignService.js'
import { ApiError } from '../utils/ApiError.js'

function parseJsonArray(value, name) {
  if (value === undefined || value === null || value === '') return []
  if (Array.isArray(value)) return value
  if (typeof value !== 'string') throw new ApiError(400, `${name} must be an array`)
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed
  } catch {
    throw new ApiError(400, `${name} contains invalid JSON`)
  }
  throw new ApiError(400, `${name} must be an array`)
}

export const virtualDesignController = {
  list: asyncHandler(async (req, res) => {
    const filters = {}
    if (req.query.packageType) filters.packageType = req.query.packageType
    if (req.query.published !== undefined) filters.published = req.query.published !== 'false'
    const items = await virtualDesignService.listVirtualDesigns(filters)
    res.json({ success: true, data: items })
  }),

  get: asyncHandler(async (req, res) => {
    const item = await virtualDesignService.getVirtualDesign(req.params.id)
    res.json({ success: true, data: item })
  }),

  create: asyncHandler(async (req, res) => {
    const file = req.files?.media?.[0] || null
    const galleryFiles = Array.isArray(req.files?.gallery) ? req.files.gallery : []
    const circularFile = req.files?.homepageCircularImage?.[0] || null
    const mediaUrls = parseJsonArray(req.body.mediaUrls, 'mediaUrls')
    if (!file && galleryFiles.length === 0 && !req.body.imageUrl && mediaUrls.length === 0) {
      return res.status(400).json({ success: false, message: 'Media file is required' })
    }
    let parsedFeatures = []
    if (req.body.features) {
      try {
        const parsed = JSON.parse(req.body.features)
        parsedFeatures = Array.isArray(parsed) ? parsed : []
      } catch {
        parsedFeatures = []
      }
    }
    const data = {
      title: req.body.title || 'Untitled',
      description: req.body.description || '',
      category: req.body.category || 'General',
      mediaType: req.body.mediaType || 'image',
      imageUrl: req.body.imageUrl || null,
      featured: req.body.featured === 'true' || req.body.featured === true,
      displayOrder: Number(req.body.displayOrder) || 0,
      published: req.body.published !== 'false' && req.body.published !== false,
      mediaUrls,
      mediaAssets: parseJsonArray(req.body.mediaAssets, 'mediaAssets'),
      price: req.body.price ? Number(req.body.price) : null,
      priceMax: req.body.priceMax ? Number(req.body.priceMax) : null,
      currency: req.body.currency || 'KES',
      priceSuffix: req.body.priceSuffix || '',
      features: parsedFeatures,
      ctaText: req.body.ctaText || 'Book',
      tagline: req.body.tagline || '',
      packageType: req.body.packageType || null,
    }
    const item = await virtualDesignService.createVirtualDesign(data, file, galleryFiles, circularFile)
    res.status(201).json({ success: true, data: item })
  }),

  update: asyncHandler(async (req, res) => {
    const file = req.files?.media?.[0] || null
    const galleryFiles = Array.isArray(req.files?.gallery) ? req.files.gallery : []
    const circularFile = req.files?.homepageCircularImage?.[0] || null
    const data = {}
    if (req.body.title !== undefined) data.title = req.body.title
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.category !== undefined) data.category = req.body.category
    if (req.body.mediaType !== undefined) data.mediaType = req.body.mediaType
    if (req.body.featured !== undefined) data.featured = req.body.featured === 'true' || req.body.featured === true
    if (req.body.displayOrder !== undefined) data.displayOrder = Number(req.body.displayOrder) || 0
    if (req.body.published !== undefined) data.published = req.body.published !== 'false' && req.body.published !== false
    if (req.body.imageUrl) data.imageUrl = req.body.imageUrl
    if (req.body.mediaAssets !== undefined) data.mediaAssets = parseJsonArray(req.body.mediaAssets, 'mediaAssets')
    if (req.body.price !== undefined) data.price = req.body.price ? Number(req.body.price) : null
    if (req.body.priceMax !== undefined) data.priceMax = req.body.priceMax ? Number(req.body.priceMax) : null
    if (req.body.currency !== undefined) data.currency = req.body.currency
    if (req.body.priceSuffix !== undefined) data.priceSuffix = req.body.priceSuffix
    if (req.body.features !== undefined) {
      try {
        const parsed = JSON.parse(req.body.features)
        data.features = Array.isArray(parsed) ? parsed : []
      } catch {
        data.features = []
      }
    }
    if (req.body.ctaText !== undefined) data.ctaText = req.body.ctaText
    if (req.body.tagline !== undefined) data.tagline = req.body.tagline
    if (req.body.packageType !== undefined) data.packageType = req.body.packageType || null
    // Parse the list of existing media URLs the client wants to keep
    if (req.body.existingMediaUrls) {
      try {
        const parsed = JSON.parse(req.body.existingMediaUrls)
        if (Array.isArray(parsed)) {
          data._keptMediaUrls = parsed
        }
      } catch {
        // Ignore parse errors
      }
    }
    const item = await virtualDesignService.updateVirtualDesign(req.params.id, data, file, galleryFiles, circularFile)
    res.json({ success: true, data: item })
  }),

  delete: asyncHandler(async (req, res) => {
    await virtualDesignService.deleteVirtualDesign(req.params.id)
    res.json({ success: true, data: { message: 'Deleted' } })
  }),
}
