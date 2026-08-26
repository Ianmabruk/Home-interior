import { asyncHandler } from '../middleware/asyncHandler.js'
import { circularTabService } from '../services/circularTabService.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

export const circularTabController = {
  list: asyncHandler(async (req, res) => {
    const tabs = await circularTabService.listCircularTabs()
    res.json({ success: true, data: tabs })
  }),

  getHomepage: asyncHandler(async (req, res) => {
    const tabs = await circularTabService.getHomepageCircularTabs()
    res.json({ success: true, data: tabs })
  }),

  update: asyncHandler(async (req, res) => {
    const { key } = req.params
    const file = req.file || (req.files?.image?.[0])

    let imageUrl = req.body.imageUrl
    let imageKey = req.body.imageKey

    if (file) {
      const uploaded = await uploadFile(file.buffer, file.mimetype, 'circular-tabs')
      imageUrl = uploaded.url
      imageKey = uploaded.path
    }

    const updateData = {}
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (imageKey !== undefined) updateData.imageKey = imageKey
    if (req.body.title !== undefined) updateData.title = req.body.title
    if (req.body.active !== undefined) updateData.active = req.body.active === 'true' || req.body.active === true
    if (req.body.displayOrder !== undefined) updateData.displayOrder = Number(req.body.displayOrder)

    const updated = await circularTabService.updateCircularTab(key, updateData)
    res.json({ success: true, data: updated })
  }),

  removeImage: asyncHandler(async (req, res) => {
    const { key } = req.params
    const tab = await circularTabService.getCircularTab(key)

    if (!tab) {
      throw failure(404, `Circular tab not found: ${key}`)
    }

    if (tab.imageKey) {
      await deleteFile(tab.imageKey).catch(() => {})
    }

    const updated = await circularTabService.updateCircularTab(key, {
      imageUrl: null,
      imageKey: null,
    })

    res.json({ success: true, data: updated })
  }),
}
