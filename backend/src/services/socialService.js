import { prisma } from '../config/database.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapSocialItem(item) {
  if (!item) return null
  return {
    id: item.id,
    name: item.name,
    platform: item.platform,
    imageUrl: item.imageUrl,
    cloudinaryId: item.cloudinaryId,
    link: item.link,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export const socialService = {
  getSocialItems,
  createSocialItem,
  updateSocialItem,
  deleteSocialItem,
  reorderSocialItems,
}

async function getSocialItems() {
  try {
    const items = await prisma.socialItem.findMany({
      orderBy: { displayOrder: 'asc' },
    })
    return items.map(mapSocialItem)
  } catch {
    return []
  }
}

async function createSocialItem(data, file) {
  if (!data.name || !data.platform || !data.link) {
    throw failure(400, 'Name, platform, and link are required')
  }
  let imageUrl = null
  let cloudinaryId = null

  if (file) {
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'socials')
    imageUrl = uploaded.url
    cloudinaryId = uploaded.path
  }

  const item = await prisma.socialItem.create({
    data: {
      name: data.name,
      platform: data.platform,
      link: data.link,
      imageUrl,
      cloudinaryId,
      displayOrder: data.displayOrder || 0,
      isActive: data.isActive !== false,
    },
  })
  return mapSocialItem(item)
}

async function updateSocialItem(id, data, file) {
  const existing = await prisma.socialItem.findUnique({ where: { id } })
  if (!existing) {
    throw failure(404, 'Social item not found')
  }

  const updateData = { ...data }

  if (file) {
    if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'socials')
    updateData.imageUrl = uploaded.url
    updateData.cloudinaryId = uploaded.path
  }

  const item = await prisma.socialItem.update({
    where: { id },
    data: updateData,
  })
  return mapSocialItem(item)
}

async function deleteSocialItem(id) {
  const existing = await prisma.socialItem.findUnique({ where: { id } })
  if (!existing) {
    throw failure(404, 'Social item not found')
  }
  if (existing.cloudinaryId) {
    await deleteFile(existing.cloudinaryId)
  }
  await prisma.socialItem.delete({ where: { id } })
  return { success: true }
}

async function reorderSocialItems(orders) {
  if (!Array.isArray(orders)) {
    throw failure(400, 'Invalid orders array')
  }
  await prisma.$transaction(
    orders.map((order) =>
      prisma.socialItem.update({
        where: { id: order.id },
        data: { displayOrder: order.displayOrder },
      })
    )
  )
  const items = await prisma.socialItem.findMany({
    orderBy: { displayOrder: 'asc' },
  })
  return items.map(mapSocialItem)
}
