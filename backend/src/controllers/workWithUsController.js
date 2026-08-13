import { asyncHandler } from '../middleware/asyncHandler.js'
import { workWithUsService } from '../services/workWithUsService.js'
import { failure } from '../utils/response.js'

export const workWithUsController = {
  list: asyncHandler(async (req, res) => {
    const items = await workWithUsService.listWorkWithUs()
    res.json({ success: true, data: items })
  }),

  get: asyncHandler(async (req, res) => {
    const item = await workWithUsService.getWorkWithUs(req.params.id)
    res.json({ success: true, data: item })
  }),

  create: asyncHandler(async (req, res) => {
    const data = {
      fullName: String(req.body.fullName || '').trim(),
      phone: String(req.body.phone || '').trim(),
      email: String(req.body.email || '').trim(),
      budget: String(req.body.budget || '').trim(),
      startDate: req.body.startDate ? String(req.body.startDate).trim() : null,
      timeline: String(req.body.timeline || '').trim(),
    }
    if (!data.fullName || !data.email || !data.phone || !data.budget || !data.timeline) {
      return res.status(400).json({ success: false, message: 'All fields are required' })
    }
    const item = await workWithUsService.createWorkWithUs(data)
    res.status(201).json({ success: true, data: item })
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const { status } = req.body
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' })
    }
    const item = await workWithUsService.updateWorkWithUsStatus(req.params.id, status)
    res.json({ success: true, data: item })
  }),

  delete: asyncHandler(async (req, res) => {
    await workWithUsService.deleteWorkWithUs(req.params.id)
    res.json({ success: true, data: { message: 'Deleted' } })
  }),

  listContent: asyncHandler(async (req, res) => {
    const items = await workWithUsService.getWorkWithUsContent()
    res.json({ success: true, data: items })
  }),

  createContent: asyncHandler(async (req, res) => {
    const file = req.file
    const data = {
      title: req.body.title || '',
      description: req.body.description || '',
      displayOrder: Number(req.body.displayOrder) || 0,
      isActive: req.body.isActive !== 'false' && req.body.isActive !== false,
    }
    const item = await workWithUsService.createWorkWithUsContent(data, file)
    res.status(201).json({ success: true, data: item })
  }),

  updateContent: asyncHandler(async (req, res) => {
    const file = req.file
    const data = {}
    if (req.body.title !== undefined) data.title = req.body.title
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.displayOrder !== undefined) data.displayOrder = Number(req.body.displayOrder) || 0
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive === 'true' || req.body.isActive === true
    const item = await workWithUsService.updateWorkWithUsContent(req.params.id, data, file)
    res.json({ success: true, data: item })
  }),

  deleteContent: asyncHandler(async (req, res) => {
    const result = await workWithUsService.deleteWorkWithUsContent(req.params.id)
    res.json({ success: true, data: result })
  }),
}
