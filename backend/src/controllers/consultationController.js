import { asyncHandler } from '../middleware/asyncHandler.js'
import { consultationService } from '../services/consultationService.js'
import { uploadFile } from '../uploads/uploadService.js'
import { triggerNewConsultationNotification } from '../services/notificationService.js'
import { emailService } from '../services/emailService.js'

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
    const type = req.body.type || 'consultation'
    const preferredDate = req.body.preferredDate || null
    const preferredTime = req.body.preferredTime || null

    const imageUrls = []
    if (file) {
      const uploaded = await uploadFile(file.buffer, file.mimetype, 'consultations')
      imageUrls.push(uploaded.url)
    }
    for (const f of files) {
      const uploaded = await uploadFile(f.buffer, f.mimetype, 'consultations')
      imageUrls.push(uploaded.url)
    }

    const extraData = { budget, timeline, projectType, name, email, phone }
    if (type === 'e-design') {
      extraData.packageName = req.body.packageName || ''
      extraData.packagePrice = null
      extraData.paymentStatus = 'pending'
      extraData.orderId = null
      extraData.purchaseDate = null
    }

    const enrichedMessage = buildMessageWithImages(
      originalMessage,
      imageUrls,
      extraData
    )

    const data = {
      type,
      name,
      email,
      phone,
      message: enrichedMessage,
      projectType,
      budget,
      timeline,
      preferredDate,
      preferredTime,
      packageName: type === 'e-design' ? (req.body.packageName || null) : null,
      packagePrice: type === 'e-design' ? null : null,
      paymentStatus: type === 'e-design' ? 'pending' : null,
      orderId: type === 'e-design' ? null : null,
      purchaseDate: type === 'e-design' ? null : null,
    }
    const consultation = await consultationService.createConsultation(data)

    // Fire-and-forget admin push notification (new consultation request).
    triggerNewConsultationNotification(consultation).catch((e) =>
      console.warn('[consultations] new-consultation push notification failed:', e?.message)
    )

    // Fire-and-forget customer confirmation email. Never blocks the response.
    if (consultation && consultation.email) {
      emailService
        .sendConsultationConfirmationEmail({
          consultation,
          toEmail: consultation.email,
          name: consultation.name,
        })
        .catch((e) => console.warn('[consultations] confirmation email failed:', e?.message))
    }

    res.status(201).json({ success: true, data: consultation })
  }),

  list: asyncHandler(async (req, res) => {
    const { status, search, page = 1, pageSize = 10, type } = req.query
    const result = await consultationService.listConsultations({ status, search, page, pageSize, type })
    res.json({ success: true, data: result })
  }),
  publicList: asyncHandler(async (req, res) => {
    const { status, search, page = 1, pageSize = 10, type } = req.query
    const result = await consultationService.listPublicConsultations({ status, search, page, pageSize, type })
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
    const { status, search, type } = req.query
    const result = await consultationService.listConsultations({ status, search, page: 1, pageSize: 10000, type })

    const headers = 'Type,Name,Email,Phone,Project Type,Budget,Timeline,Package,Price,Payment Status,Order ID,Message,Status,Date\n'
    const rows = result.items
      .map((c) => {
        const parsed = parseConsultationMessage(c.message || '')
        return `"${(c.type || '').replace(/"/g, '""')}","${(c.name || '').replace(/"/g, '""')}","${(c.email || '').replace(/"/g, '""')}","${(c.phone || '').replace(/"/g, '""')}","${(parsed.extraData.projectType || '').replace(/"/g, '""')}","${(parsed.extraData.budget || '').replace(/"/g, '""')}","${(parsed.extraData.timeline || '').replace(/"/g, '""')}","${(c.packageName || '').replace(/"/g, '""')}",${c.packagePrice || 0},"${(c.paymentStatus || '').replace(/"/g, '""')}","${(c.orderId || '').replace(/"/g, '""')}","${(parsed.text || '').replace(/"/g, '""')}","${c.status}","${new Date(c.createdAt).toISOString()}"`
      })
      .join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="consultations.csv"`)
    res.send(headers + rows)
  }),
}
