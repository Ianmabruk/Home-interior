import { asyncHandler } from '../middleware/asyncHandler.js'
import { socialService } from '../services/socialService.js'

export const socialController = {
  get: asyncHandler(async (req, res) => {
    const items = await socialService.getSocialItems()
    res.json({ success: true, data: items })
  }),

  create: asyncHandler(async (req, res) => {
    const file = req.file || null
    const data = {
      name: req.body.name,
      platform: req.body.platform,
      link: req.body.link,
      displayOrder: req.body.displayOrder ? Number(req.body.displayOrder) : 0,
      isActive: req.body.isActive !== 'false' && req.body.isActive !== false,
    }
    const item = await socialService.createSocialItem(data, file)
    res.status(201).json({ success: true, data: item })
  }),

  update: asyncHandler(async (req, res) => {
    const { id } = req.params
    const file = req.file || null
    const data = {}
    if (req.body.name !== undefined) data.name = req.body.name
    if (req.body.platform !== undefined) data.platform = req.body.platform
    if (req.body.link !== undefined) data.link = req.body.link
    if (req.body.displayOrder !== undefined) data.displayOrder = Number(req.body.displayOrder)
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive === 'true' || req.body.isActive === true
    const item = await socialService.updateSocialItem(id, data, file)
    res.json({ success: true, data: item })
  }),

  delete: asyncHandler(async (req, res) => {
    const { id } = req.params
    await socialService.deleteSocialItem(id)
    res.json({ success: true, data: { id } })
  }),

  reorder: asyncHandler(async (req, res) => {
    const orders = req.body.orders || req.body
    const items = await socialService.reorderSocialItems(orders)
    res.json({ success: true, data: items })
  }),
}
