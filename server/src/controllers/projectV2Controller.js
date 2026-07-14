import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { projectV2Service } from '../services/projectV2Service.js'

export const projectV2Controller = {
  list: asyncHandler(async (req, res) => {
    const items = await projectV2Service.list()
    res.json(sendSuccess(items))
  }),

  upload: asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, 'Video file is required')
    }

    const order = Number(req.body.order || 0)
    const result = await projectV2Service.uploadVideo({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      order,
    })

    res.status(201).json(sendSuccess(result))
  }),

  reorder: asyncHandler(async (req, res) => {
    const { order } = req.body
    if (!Array.isArray(order) || order.length === 0) {
      throw new ApiError(400, 'order must be a non-empty array of ids')
    }
    const items = await projectV2Service.reorder(order)
    res.json(sendSuccess(items))
  }),

  togglePublish: asyncHandler(async (req, res) => {
    const item = await projectV2Service.togglePublish(req.params.id)
    res.json(sendSuccess(item))
  }),

  remove: asyncHandler(async (req, res) => {
    await projectV2Service.remove(req.params.id)
    res.json(sendSuccess({ message: 'Project deleted' }))
  }),
}
