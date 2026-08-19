import { asyncHandler } from '../middleware/asyncHandler.js'
import { testimonialService } from '../services/testimonialService.js'
import { failure } from '../utils/response.js'

export const testimonialController = {
  list: asyncHandler(async (req, res) => {
    const items = await testimonialService.listTestimonials()
    res.json({ success: true, data: items })
  }),

  get: asyncHandler(async (req, res) => {
    const item = await testimonialService.getTestimonial(req.params.id)
    res.json({ success: true, data: item })
  }),

  create: asyncHandler(async (req, res) => {
    const files = req.files || []
    const photoFile = files.find((f) => f.fieldname === 'photo')
    const circularFile = files.find((f) => f.fieldname === 'homepageCircularImage')
    const data = {
      clientName: req.body.clientName || '',
      content: req.body.testimonial || req.body.content || '',
      project: req.body.project || '',
      displayOrder: Number(req.body.displayOrder) || 0,
      isActive: req.body.isActive !== 'false' && req.body.isActive !== false,
      initial: req.body.initial || '',
    }
    const item = await testimonialService.createTestimonial(data, photoFile, circularFile)
    res.status(201).json({ success: true, data: item })
  }),

  update: asyncHandler(async (req, res) => {
    const files = req.files || []
    const photoFile = files.find((f) => f.fieldname === 'photo')
    const circularFile = files.find((f) => f.fieldname === 'homepageCircularImage')
    const removeHomepageCircularImage = req.body.removeHomepageCircularImage === 'true'
    const data = {}
    if (req.body.clientName !== undefined) data.clientName = req.body.clientName
    if (req.body.testimonial !== undefined) data.content = req.body.testimonial
    if (req.body.content !== undefined) data.content = req.body.content
    if (req.body.project !== undefined) data.project = req.body.project
    if (req.body.displayOrder !== undefined) data.displayOrder = Number(req.body.displayOrder) || 0
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive === 'true' || req.body.isActive === true
    if (req.body.initial !== undefined) data.initial = req.body.initial
    const item = await testimonialService.updateTestimonial(req.params.id, data, photoFile, circularFile, removeHomepageCircularImage)
    res.json({ success: true, data: item })
  }),

  delete: asyncHandler(async (req, res) => {
    await testimonialService.deleteTestimonial(req.params.id)
    res.json({ success: true, data: { message: 'Deleted' } })
  }),
}
