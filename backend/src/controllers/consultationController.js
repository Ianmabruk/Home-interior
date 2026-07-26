import { asyncHandler } from '../middleware/asyncHandler.js'
import { consultationService } from '../services/consultationService.js'
import { failure } from '../utils/response.js'
import { uploadFile } from '../uploads/uploadService.js'

function buildMessageWithImages(originalMessage, imageUrls, extraData = {}) {
  const header = {
    ...extraData,
    images: imageUrls,
  }
  const headerJson = JSON.stringify(header)
  return headerJson + '\n\n' + (originalMessage || '')
}

function parseConsultationMessage(message) {
  if (!message) return { images: [], extraData: {}, text: '' }
  const firstNewline = message.indexOf('\n\n')
  if (firstNewline === -1) return { images: [], extraData: {}, text: message }
  const headerStr = message.substring(0, firstNewline)
  const text = message.substring(firstNewline + 2)
  try {
    const header = JSON.parse(headerStr)
    return {
      images: header.images || [],
      extraData: { ...header, images: undefined },
      text,
    }
  } catch {
    return { images: [], extraData: {}, text: message }
  }
}

export const consultationController = {
  publicCreate: asyncHandler(async (req, res) => {
    const file = req.file
    const files = Array.isArray(req.files) ? req.files : []
    const originalMessage = req.body.message || ''
    const name = req.body.name || ''
    const email = req.body.email || ''
    const phone = req.body.phone || ''
    const budget = req.body.budget || ''
    const timeline = req.body.timeline || ''
    const projectType = req.body.projectType || ''

    const imageUrls = []
    if (file) {
      const uploaded = await uploadFile(file.buffer, file.mimetype, 'consultations')
      imageUrls.push(uploaded.url)
    }
    for (const f of files) {
      const uploaded = await uploadFile(f.buffer, f.mimetype, 'consultations')
      imageUrls.push(uploaded.url)
    }

    const enrichedMessage = buildMessageWithImages(
      originalMessage,
      imageUrls,
      { budget, timeline, projectType, name, email, phone }
    )

    const data = {
      name,
      email,
      phone,
      message: enrichedMessage,
      status: 'new',
    }
    const consultation = await consultationService.createConsultation(data)
    res.status(201).json({ success: true, data: consultation })
  }),

  list: asyncHandler(async (req, res) => {
    const { status, search, page = 1, pageSize = 10 } = req.query
    const result = await consultationService.listConsultations({ status, search, page, pageSize })
    res.json({ success: true, data: result })
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const item = await consultationService.updateConsultationStatus(req.params.id, req.body.status)
    res.json({ success: true, data: item })
  }),

  delete: asyncHandler(async (req, res) => {
    await consultationService.deleteConsultation(req.params.id)
    res.json({ success: true, data: { message: 'Deleted' } })
  }),

  exportCsv: asyncHandler(async (req, res) => {
    const { status, search } = req.query
    const result = await consultationService.listConsultations({ status, search, page: 1, pageSize: 10000 })

    const headers = 'Name,Email,Phone,Budget,Timeline,Project Type,Message,Status,Date\n'
    const rows = result.items
      .map((c) => {
        const parsed = parseConsultationMessage(c.message || '')
        return `"${(c.name || '').replace(/"/g, '""')}","${(c.email || '').replace(/"/g, '""')}","${(c.phone || '').replace(/"/g, '""')}","${parsed.extraData.budget || ''}","${parsed.extraData.timeline || ''}","${parsed.extraData.projectType || ''}","${(parsed.text || '').replace(/"/g, '""')}","${c.status}","${new Date(c.createdAt).toISOString()}"`
      })
      .join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="consultations.csv"`)
    res.send(headers + rows)
  }),
}
