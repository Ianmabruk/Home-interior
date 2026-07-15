import { uploadVideo, deleteMedia } from '../services/uploadService.js'
import { prisma } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { withId, withIdArray } from '../utils/helpers.js'

const FOLDER = 'hok/project-v2'

const V2_SELECT = {
  id: true,
  videoUrl: true,
  videoPublicId: true,
  thumbnailUrl: true,
  thumbnailPublicId: true,
  order: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
}

export const projectV2Service = {
  async list({ where = {}, orderBy = [{ order: 'asc' }, { createdAt: 'desc' }], take } = {}) {
    const items = await prisma.projectV2.findMany({
      where,
      orderBy,
      ...(take ? { take } : {}),
      select: V2_SELECT,
    })
    return withIdArray(items)
  },

  async uploadVideo({ buffer, mimeType, order = 0 }) {
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime']
    if (!allowed.includes(mimeType)) {
      throw new ApiError(415, `Unsupported video format: ${mimeType}`)
    }

    const result = await uploadVideo(buffer, FOLDER, mimeType)
    const publicId = result.public_id
    const videoUrl = result.secure_url
    const thumbnailUrl =
      result.thumbnail_url || result.assets?.thumbnail?.secure_url || null
    const thumbnailPublicId = result.assets?.thumbnail?.public_id || null

    const record = await prisma.projectV2.create({
      data: {
        videoUrl,
        videoPublicId: publicId,
        thumbnailUrl,
        thumbnailPublicId,
        order,
        isPublished: true,
      },
      select: V2_SELECT,
    })

    return withId(record)
  },

  async reorder(idList) {
    await prisma.$transaction(
      idList.map((id, index) =>
        prisma.projectV2.update({ where: { id }, data: { order: index } }),
      ),
    )
    return this.list()
  },

  async togglePublish(id) {
    const existing = await prisma.projectV2.findUnique({ where: { id } })
    if (!existing) throw new ApiError(404, 'Project not found')
    const updated = await prisma.projectV2.update({
      where: { id },
      data: { isPublished: !existing.isPublished },
      select: V2_SELECT,
    })
    return withId(updated)
  },

  async remove(id) {
    const existing = await prisma.projectV2.findUnique({ where: { id } })
    if (existing) {
      if (existing.videoPublicId) {
        await deleteMedia(existing.videoPublicId, 'video').catch((err) =>
          console.error('[PROJECT_V2][DELETE] Cloudinary delete failed:', err?.message),
        )
      }
      if (existing.thumbnailPublicId) {
        await deleteMedia(existing.thumbnailPublicId, 'image').catch((err) =>
          console.error('[PROJECT_V2][DELETE] thumbnail Cloudinary delete failed:', err?.message),
        )
      }
    }
    await prisma.projectV2.delete({ where: { id } })
    return { message: 'Project deleted' }
  },
}
