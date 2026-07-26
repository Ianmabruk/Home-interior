import { asyncHandler } from '../middleware/asyncHandler.js'
import { contactService } from '../services/contactService.js'

export const contactController = {
  get: asyncHandler(async (req, res) => {
    const contact = await contactService.getContact()
    res.json({ success: true, data: contact })
  }),
}