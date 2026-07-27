import { asyncHandler } from '../middleware/asyncHandler.js'
import { consultationService } from '../services/consultationService.js'

export const chatController = {
  get: asyncHandler(async (req, res) => {
    const items = await consultationService.listConsultations({ status: 'pending' })
    res.json({ success: true, data: items.items || items })
  }),

  post: asyncHandler(async (req, res) => {
    const { message } = req.body
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' })
    }
    const consultation = await consultationService.createConsultation({
      name: 'Chat User',
      email: 'chat@example.com',
      message,
    })
    res.status(201).json({ success: true, data: consultation })
  }),
}