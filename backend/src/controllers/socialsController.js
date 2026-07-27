import { asyncHandler } from '../middleware/asyncHandler.js'
import { aboutService } from '../services/aboutService.js'

export const socialsController = {
  get: asyncHandler(async (req, res) => {
    const about = await aboutService.getAbout()
    const socials = about?.socials ? (typeof about.socials === 'string' ? JSON.parse(about.socials) : about.socials) : {}
    res.json({ success: true, data: socials })
  }),
}