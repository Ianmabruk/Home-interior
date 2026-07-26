import { asyncHandler } from '../middleware/asyncHandler.js'
import { contactService } from '../services/contactService.js'
import { messageService } from '../services/messageService.js'

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
}