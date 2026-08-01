import { asyncHandler } from '../middleware/asyncHandler.js'
import { aboutService } from '../services/aboutService.js'

export const socialsController = {
  get: asyncHandler(async (req, res) => {
    const about = await aboutService.getAbout()
    const socials = about?.socials ? (typeof about.socials === 'string' ? JSON.parse(about.socials) : about.socials) : {}
    res.json({ success: true, data: { ...socials, image: about?.socialImage || null } })
  }),

  update: asyncHandler(async (req, res) => {
    const { tiktok, instagram, facebook, pinterest, linkedin, youtube } = req.body
    const socials = { tiktok, instagram, facebook, pinterest, linkedin, youtube }
    const about = await aboutService.createOrUpdateAbout({ socials: JSON.stringify(socials) })
    res.json({ success: true, data: { ...socials, image: about?.socialImage || null } })
  }),
}