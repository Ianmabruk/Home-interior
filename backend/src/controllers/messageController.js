import { asyncHandler } from '../middleware/asyncHandler.js'
import { messageService } from '../services/messageService.js'
import { failure } from '../utils/response.js'

export const messageController = {
  list: asyncHandler(async (req, res) => {
    const items = await messageService.listMessages()
    res.json({ success: true, data: items })
  }),

  get: asyncHandler(async (req, res) => {
    const item = await messageService.getMessage(req.params.id)
    res.json({ success: true, data: item })
  }),

  publicCreate: asyncHandler(async (req, res) => {
    const { name, email, subject, content } = req.body
    if (!name || !email || !content) {
      throw failure(400, 'Name, email, and content are required')
    }
    const item = await messageService.createMessage({ name, email, subject, content })
    res.status(201).json({ success: true, data: item })
  }),

  reply: asyncHandler(async (req, res) => {
    const { reply } = req.body
    if (!reply) throw failure(400, 'Reply is required')
    const item = await messageService.replyToMessage(req.params.id, reply)
    res.json({ success: true, data: item })
  }),

  markRead: asyncHandler(async (req, res) => {
    const item = await messageService.markMessageRead(req.params.id)
    res.json({ success: true, data: item })
  }),

  delete: asyncHandler(async (req, res) => {
    await messageService.deleteMessage(req.params.id)
    res.json({ success: true, data: { message: 'Deleted' } })
  }),
}