import { asyncHandler } from '../middleware/asyncHandler.js'
import { blogService } from '../services/blogService.js'
import { failure } from '../utils/response.js'

export const blogController = {
  list: asyncHandler(async (req, res) => {
    const items = await blogService.listBlogs()
    res.json({ success: true, data: items })
  }),

  getAll: asyncHandler(async (req, res) => {
    const items = await blogService.getAllBlogs()
    res.json({ success: true, data: items })
  }),

  get: asyncHandler(async (req, res) => {
    const item = await blogService.getBlog(req.params.id)
    res.json({ success: true, data: item })
  }),

  create: asyncHandler(async (req, res) => {
    const imageFile = req.file || null
    const videoFile = req.files?.video?.[0] || null
    const data = {
      title: req.body.title || 'Untitled',
      description: req.body.description || '',
      published: req.body.published === 'true' || req.body.published === true,
      featured: req.body.featured === 'true' || req.body.featured === true,
      displayOrder: Number(req.body.displayOrder) || 0,
    }
    const item = await blogService.createBlog(data, imageFile, videoFile)
    res.status(201).json({ success: true, data: item })
  }),

  update: asyncHandler(async (req, res) => {
    const imageFile = req.file || null
    const videoFile = req.files?.video?.[0] || null
    const data = {}
    if (req.body.title !== undefined) data.title = req.body.title
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.published !== undefined) data.published = req.body.published === 'true' || req.body.published === true
    if (req.body.featured !== undefined) data.featured = req.body.featured === 'true' || req.body.featured === true
    if (req.body.displayOrder !== undefined) data.displayOrder = Number(req.body.displayOrder) || 0
    const item = await blogService.updateBlog(req.params.id, data, imageFile, videoFile)
    res.json({ success: true, data: item })
  }),

  delete: asyncHandler(async (req, res) => {
    await blogService.deleteBlog(req.params.id)
    res.json({ success: true, data: { message: 'Deleted' } })
  }),
}