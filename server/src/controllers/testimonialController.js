import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { mediaService } from '../services/media.service.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray } from '../utils/helpers.js'

const sortByOrder = (items) =>
  [...(items || [])].sort((a, b) => {
    const o = (a.displayOrder || 0) - (b.displayOrder || 0)
    if (o !== 0) return o
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  })

export const listPublic = asyncHandler(async (req, res) => {
  const items = await prisma.testimonial.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
  })
  res.json(sendSuccess(withIdArray(sortByOrder(items))))
})

export const listAdmin = asyncHandler(async (req, res) => {
  const items = await prisma.testimonial.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
  })
  res.json(sendSuccess(withIdArray(sortByOrder(items))))
})

const testimonialSchema = z.object({
  clientName: z.string().min(2, 'Client name is required'),
  position: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  testimonial: z.string().min(4, 'Testimonial text is required'),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  displayOrder: z.coerce.number().int().optional(),
  isActive: z.preprocess(
    (v) => (v === 'true' || v === true ? true : v === 'false' || v === false ? false : v),
    z.boolean().optional(),
  ),
})

export const create = asyncHandler(async (req, res) => {
  const body = testimonialSchema.parse(req.body)
  let photoUrl
  let photoPublicId
  if (req.file) {
    const upload = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder: 'hok/testimonials', type: 'image' })
    photoUrl = upload.secure_url
    photoPublicId = upload.public_id
  }

  const item = await prisma.testimonial.create({
    data: {
      clientName: body.clientName,
      position: body.position ?? null,
      company: body.company ?? null,
      testimonial: body.testimonial,
      rating: body.rating ?? 5,
      displayOrder: body.displayOrder ?? 0,
      isActive: body.isActive ?? true,
      photoUrl,
      photoPublicId,
    },
  })

  res.status(201).json(sendSuccess(withId(item)))
})

export const update = asyncHandler(async (req, res) => {
  const existing = await prisma.testimonial.findUnique({ where: { id: req.params.id } })
  if (!existing) throw new ApiError(404, 'Testimonial not found')

  const body = testimonialSchema.partial().parse(req.body)
  const payload = {}
  if (body.clientName !== undefined) payload.clientName = body.clientName
  if (body.position !== undefined) payload.position = body.position
  if (body.company !== undefined) payload.company = body.company
  if (body.testimonial !== undefined) payload.testimonial = body.testimonial
  if (body.rating !== undefined) payload.rating = body.rating
  if (body.displayOrder !== undefined) payload.displayOrder = body.displayOrder
  if (body.isActive !== undefined) payload.isActive = body.isActive

  if (req.file) {
    const upload = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder: 'hok/testimonials', type: 'image' })
    if (existing.photoPublicId) {
      try { await mediaService.delete(existing.photoPublicId, 'image') } catch { /* ignore */ }
    }
    payload.photoUrl = upload.secure_url
    payload.photoPublicId = upload.public_id
  }

  const item = await prisma.testimonial.update({ where: { id: req.params.id }, data: payload })
  res.json(sendSuccess(withId(item)))
})

export const remove = asyncHandler(async (req, res) => {
  const existing = await prisma.testimonial.findUnique({ where: { id: req.params.id } })
  if (!existing) throw new ApiError(404, 'Testimonial not found')
  if (existing.photoPublicId) {
    try { await mediaService.delete(existing.photoPublicId, 'image') } catch { /* ignore */ }
  }
  await prisma.testimonial.delete({ where: { id: req.params.id } })
  res.json(sendSuccess({ message: 'Testimonial deleted' }))
})

export const reorder = asyncHandler(async (req, res) => {
  const incoming = Array.isArray(req.body.order) ? req.body.order : []
  if (!incoming.length) throw new ApiError(400, 'order array is required')
  await prisma.$transaction(
    incoming.map((id, index) => prisma.testimonial.update({ where: { id: String(id) }, data: { displayOrder: index } })),
  )
  const items = await prisma.testimonial.findMany({ orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }] })
  res.json(sendSuccess(withIdArray(sortByOrder(items))))
})

export const testimonialController = {
  listPublic,
  listAdmin,
  create,
  update,
  remove,
  reorder,
}
