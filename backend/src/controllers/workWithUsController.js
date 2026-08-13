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
}
