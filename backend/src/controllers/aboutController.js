import { asyncHandler } from '../middleware/asyncHandler.js'
import { aboutService } from '../services/aboutService.js'
import { failure } from '../utils/response.js'

export const aboutController = {
  get: asyncHandler(async (req, res) => {
    const item = await aboutService.getAbout()
    res.json({ success: true, data: item })
  }),

  update: asyncHandler(async (req, res) => {
    const aboutFile = req.files?.media?.[0] || req.file
    const socialFile = req.files?.socialMedia?.[0] || null
    const homepageCircularImageFile = req.files?.homepageCircularImage?.[0] || null
    const removeHomepageCircularImage = req.body.removeHomepageCircularImage === 'true'
    const data = {}
    if (req.body.title !== undefined) data.title = req.body.title
    if (req.body.subtitle !== undefined) data.subtitle = req.body.subtitle
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.story !== undefined) data.story = req.body.story
    if (req.body.companyDescription !== undefined) data.companyDesc = req.body.companyDescription
    if (req.body.mission !== undefined) data.mission = req.body.mission
    if (req.body.vision !== undefined) data.vision = req.body.vision
    if (req.body.experience !== undefined) data.experience = req.body.experience
    if (req.body.values !== undefined) data.values = req.body.values
    if (req.body.location !== undefined) data.location = req.body.location
    if (req.body.contactEmail !== undefined) data.contactEmail = req.body.contactEmail
    if (req.body.buttonText !== undefined) data.buttonText = req.body.buttonText
    if (req.body.buttonUrl !== undefined) data.buttonUrl = req.body.buttonUrl
    if (req.body.projectsCompleted !== undefined) data.projectsCompleted = Number(req.body.projectsCompleted) || 0
    if (req.body.happyClients !== undefined) data.happyClients = Number(req.body.happyClients) || 0
    if (req.body.yearsExperience !== undefined) data.yearsExperience = Number(req.body.yearsExperience) || 0
    if (req.body.countriesServed !== undefined) data.countriesServed = Number(req.body.countriesServed) || 0
    if (req.body.socials !== undefined) {
      try {
        data.socials = typeof req.body.socials === 'string' ? req.body.socials : JSON.stringify(req.body.socials)
      } catch {
        data.socials = '{}'
      }
    }
    if (Object.keys(data).length === 0 && !aboutFile && !socialFile && !homepageCircularImageFile && !removeHomepageCircularImage) {
      return res.status(400).json({ success: false, message: 'No data provided for update' })
    }
    const item = await aboutService.createOrUpdateAbout(data, aboutFile, socialFile, homepageCircularImageFile, removeHomepageCircularImage)
    res.json({ success: true, data: item })
  }),
}
