import { prisma } from '../config/database.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapImage(item) {
  if (!item) return null
  return {
    id: item.id,
    aboutId: item.aboutId,
    imageUrl: item.imageUrl,
    cloudinaryId: item.cloudinaryId,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export const aboutImageService = {
  getAboutImages,
  createAboutImage,
  updateAboutImage,
  deleteAboutImage,
  reorderAboutImages,
}

async function getAboutImages(aboutId) {
  try {
    const items = await prisma.aboutImage.findMany({
      where: { aboutId },
      orderBy: { displayOrder: 'asc' },
    })
    return items.map(mapImage)
  } catch {
    return []
  }
}

async function createAboutImage(aboutId, file, displayOrder = 0) {
  if (!file) {
    throw failure(400, 'No image file provided')
  }
  const uploaded = await uploadFile(file.buffer, file.mimetype, 'about')
  const item = await prisma.aboutImage.create({
    data: {
      aboutId,
      imageUrl: uploaded.url,
      cloudinaryId: uploaded.path,
      displayOrder,
    },
  })
  return mapImage(item)
}

async function updateAboutImage(id, data, file) {
  const existing = await prisma.aboutImage.findUnique({ where: { id } })
  if (!existing) {
    throw failure(404, 'About image not found')
  }

  const updateData = { ...data }

  if (file) {
    if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'about')
    updateData.imageUrl = uploaded.url
    updateData.cloudinaryId = uploaded.path
  }

  const item = await prisma.aboutImage.update({
    where: { id },
    data: updateData,
  })
  return mapImage(item)
}

async function deleteAboutImage(id) {
  const existing = await prisma.aboutImage.findUnique({ where: { id } })
  if (!existing) {
    throw failure(404, 'About image not found')
  }
  if (existing.cloudinaryId) {
    await deleteFile(existing.cloudinaryId)
  }
  await prisma.aboutImage.delete({ where: { id } })
  return { success: true }
}

async function reorderAboutImages(aboutId, orders) {
  if (!Array.isArray(orders)) {
    throw failure(400, 'Invalid orders array')
  }
  await prisma.$transaction(
    orders.map((order) =>
      prisma.aboutImage.update({
        where: { id: order.id },
        data: { displayOrder: order.displayOrder },
      })
    )
  )
  const items = await prisma.aboutImage.findMany({
    where: { aboutId },
    orderBy: { displayOrder: 'asc' },
  })
  return items.map(mapImage)
}
