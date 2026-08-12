import { asyncHandler } from '../middleware/asyncHandler.js'
import { contactService } from '../services/contactService.js'
import { messageService } from '../services/messageService.js'
import { uploadFile } from '../uploads/uploadService.js'

export const contactController = {
  get: asyncHandler(async (req, res) => {
    const contact = await contactService.getContact()
    res.json({ success: true, data: contact })
  }),

  post: asyncHandler(async (req, res) => {
    const { fullName, email, phone, subject, message } = req.body
    const content = [message, phone ? `Phone: ${phone}` : ''].filter(Boolean).join('\n')
    const data = {
      name: fullName || 'Website Visitor',
      email: email || '',
      subject: subject || 'Contact Form',
      content: content || message,
    }
    const item = await messageService.createMessage(data)
    res.status(201).json({ success: true, data: item })
  }),

  inquiry: asyncHandler(async (req, res) => {
    const { fullName, email, phone, projectSummary } = req.body
    const files = req.files || {}

    const uploadedUrls = []
    for (const key of ['image1', 'image2', 'image3']) {
      const file = files[key]?.[0]
      if (file) {
        const uploaded = await uploadFile(file.buffer, file.mimetype, 'contact-inquiries')
        uploadedUrls.push(uploaded.url)
      }
    }

    const contentParts = [
      projectSummary || 'Service Inquiry',
      phone ? `Phone: ${phone}` : '',
      uploadedUrls.length > 0 ? `Images: ${uploadedUrls.join(', ')}` : '',
    ].filter(Boolean)

    const data = {
      name: fullName || 'Website Visitor',
      email: email || '',
      subject: 'Service Inquiry',
      content: contentParts.join('\n'),
    }
    const item = await messageService.createMessage(data)
    res.status(201).json({ success: true, data: item })
  }),
}