import { asyncHandler } from '../middleware/asyncHandler.js'
import { blogService } from '../services/blogService.js'
import { invalidateCachePattern } from '../utils/cache.js'
import { failure } from '../utils/response.js'
import { createSignedVideoUpload, verifyCloudinaryVideo } from '../config/cloudinary.js'

function validateSavedVideoAsset(asset) {
  if (!asset) return null
  if (
    typeof asset.secureUrl !== 'string'
    || !asset.secureUrl.startsWith('https://res.cloudinary.com/')
    || !asset.secureUrl.includes('/video/upload/')
    || typeof asset.publicId !== 'string'
    || !asset.publicId
  ) {
    throw failure(422, 'Invalid video asset. Upload and verify the video again.')
  }
  return {
    ...asset,
    resourceType: 'video',
  }
}

export const blogController = {
  signVideoUpload: asyncHandler(async (req, res) => {
    const raw = String(req.body?.publicId || '').trim()
    if (!/^[a-zA-Z0-9_-]{8,180}$/.test(raw)) {
      throw failure(400, 'Invalid video upload public_id')
    }
    res.json({ success: true, data: createSignedVideoUpload(raw) })
  }),

  verifyVideoUpload: asyncHandler(async (req, res) => {
    const data = await verifyCloudinaryVideo(req.body?.publicId, req.body?.secureUrl)
    res.json({ success: true, data })
  }),
  list: asyncHandler(async (req, res) => {
    const items = await blogService.listBlogs()
    res.json({ success: true, data: items })
  }),

  listPublished: asyncHandler(async (req, res) => {
    const result = await blogService.listPublishedBlogs({
      search: req.query.search,
      category: req.query.category,
      tag: req.query.tag,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
    })
    res.json({ success: true, data: result.items, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } })
  }),

  getAll: asyncHandler(async (req, res) => {
    const result = await blogService.getAllBlogs({
      search: req.query.search,
      category: req.query.category,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
    })
    res.json({ success: true, data: result.items, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } })
  }),

  get: asyncHandler(async (req, res) => {
    const item = await blogService.getBlog(req.params.id)
    res.json({ success: true, data: item })
  }),

  getBySlug: asyncHandler(async (req, res) => {
    const item = await blogService.getBlogBySlug(req.params.slug)
    res.json({ success: true, data: item })
  }),

  getPublished: asyncHandler(async (req, res) => {
    const item = await blogService.getPublishedBlog(req.params.id)
    res.json({ success: true, data: item })
  }),

  recordView: asyncHandler(async (req, res) => {
    // Only increment for published posts; silently ignore invalid IDs
    const item = await blogService.getPublishedBlogSilent(req.params.id)
    if (item) await blogService.incrementViews(item.id)
    res.json({ success: true })
  }),

   related: asyncHandler(async (req, res) => {
    const item = await blogService.getPublishedBlog(req.params.id)
    if (!item) throw failure(404, 'Blog not found')
    const related = await blogService.getRelatedBlogs(item.id, item.category, 4)
    res.json({ success: true, data: related })
  }),

  getCategoriesAndTags: asyncHandler(async (req, res) => {
    const result = await blogService.getCategoriesAndTags()
    res.json({ success: true, data: result })
  }),

  getPreviousAndNext: asyncHandler(async (req, res) => {
    const item = await blogService.getPublishedBlog(req.params.id)
    if (!item) throw failure(404, 'Blog not found')
    const nav = await blogService.getPreviousAndNext(req.params.id)
    res.json({ success: true, data: nav })
  }),

  stats: asyncHandler(async (req, res) => {
    const stats = await blogService.getBlogStats()
    res.json({ success: true, data: stats })
  }),

   create: asyncHandler(async (req, res) => {
     const imageFile = req.files?.image?.[0] || null
     const videoFile = req.files?.video?.[0] || null
     const contentFiles = Array.isArray(req.files?.contentImages) ? req.files.contentImages : []
     const homepageCircularImageFile = req.files?.homepageCircularImage?.[0] || null

     const data = {
       title: req.body.title,
       subtitle: req.body.subtitle || '',
       slug: req.body.slug || '',
       description: req.body.description || '',
       content: req.body.content || '',
       category: req.body.category || '',
       tags: req.body.tags || [],
       author: req.body.author || '',
       metaDescription: req.body.metaDescription || '',
       published: req.body.published === 'true' || req.body.published === true,
       featured: req.body.featured === 'true' || req.body.featured === true,
       displayOrder: Number(req.body.displayOrder) || 0,
       publishDate: req.body.publishDate ? new Date(req.body.publishDate) : null,
       videoAsset: req.body.videoAsset || null,
     }

      if (data.videoAsset) {
        data.videoAsset = validateSavedVideoAsset(data.videoAsset)
        data.videoAsset.originalName = req.body.videoAsset?.originalName || null
      }

      const item = await blogService.createBlog(data, imageFile, videoFile, contentFiles, homepageCircularImageFile)
      invalidateCachePattern('blog')
      invalidateCachePattern('homepage')
      res.status(201).json({ success: true, data: item })
    }),

   update: asyncHandler(async (req, res) => {
    const imageFile = req.files?.image?.[0] || null
    const videoFile = req.files?.video?.[0] || null
    const contentFiles = Array.isArray(req.files?.contentImages) ? req.files.contentImages : []
    const homepageCircularImageFile = req.files?.homepageCircularImage?.[0] || null
    const removeHomepageCircularImage = req.body.removeHomepageCircularImage === 'true'
    const removeVideo = req.body.removeVideo === 'true'

    const data = {}
    if (req.body.title !== undefined) data.title = req.body.title
    if (req.body.subtitle !== undefined) data.subtitle = req.body.subtitle
    if (req.body.slug !== undefined) data.slug = req.body.slug
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.content !== undefined) data.content = req.body.content
    if (req.body.category !== undefined) data.category = req.body.category
    if (req.body.tags !== undefined) data.tags = req.body.tags
    if (req.body.author !== undefined) data.author = req.body.author
    if (req.body.metaDescription !== undefined) data.metaDescription = req.body.metaDescription
    if (req.body.published !== undefined) data.published = req.body.published
    if (req.body.featured !== undefined) data.featured = req.body.featured
    if (req.body.displayOrder !== undefined) data.displayOrder = req.body.displayOrder
    if (req.body.publishDate !== undefined) data.publishDate = req.body.publishDate ? new Date(req.body.publishDate) : null
    if (req.body.videoAsset !== undefined) data.videoAsset = req.body.videoAsset

    if (data.videoAsset) {
      data.videoAsset = validateSavedVideoAsset(data.videoAsset)
      data.videoAsset.originalName = req.body.videoAsset?.originalName || null
    }

    let removeMediaUrls = []
    if (req.body.removeMediaUrls) {
      try {
        removeMediaUrls = JSON.parse(req.body.removeMediaUrls)
      } catch {
        removeMediaUrls = []
      }
    }

    const item = await blogService.updateBlog(req.params.id, data, imageFile, videoFile, contentFiles, removeMediaUrls, homepageCircularImageFile, removeHomepageCircularImage, removeVideo)
    invalidateCachePattern('blog')
    invalidateCachePattern('homepage')
    res.json({ success: true, data: item })
  }),

  delete: asyncHandler(async (req, res) => {
    await blogService.deleteBlog(req.params.id)
    invalidateCachePattern('blog')
    invalidateCachePattern('homepage')
    res.json({ success: true, data: { message: 'Deleted' } })
  }),
}
