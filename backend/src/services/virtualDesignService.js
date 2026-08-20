import { prisma } from '../config/database.js'
import { uploadFile, deleteFile, deleteFiles } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapVD(item) {
  return {
    ...item,
    _id: item.id,
    id: item.id,
    mediaUrl: item.imageUrl,
    mediaType: item.mediaType,
    galleryMedia: (item.mediaUrls || []).map((url) => ({ url, type: item.mediaType })),
    imageUrl: item.imageUrl,
    mediaUrls: item.mediaUrls,
    homepageCircularImage: item.homepageCircularImage,
    homepageCircularImageId: item.homepageCircularImageId,
  }
}

export const virtualDesignService = {
  listVirtualDesigns,
  getVirtualDesign,
  createVirtualDesign,
  updateVirtualDesign,
  deleteVirtualDesign,
}

async function listVirtualDesigns() {
  try {
    const items = await prisma.virtualDesign.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return items.map(mapVD)
  } catch {
    return []
  }
}

async function getVirtualDesign(id) {
  try {
    const item = await prisma.virtualDesign.findUnique({ where: { id } })
    if (!item) throw failure(404, 'Virtual design not found')
    return mapVD(item)
  } catch (err) {
    if (err?.status === 404) throw err
    throw failure(500, 'Failed to fetch virtual design')
  }
}

async function createVirtualDesign(data, file, galleryFiles, circularFile = null) {
  const createData = { ...data }
  const mediaUrls = []

  const uploadPromises = []
  for (const f of galleryFiles) {
    uploadPromises.push(uploadFile(f.buffer, f.mimetype, 'virtual-designs'))
  }
  const uploadedUrls = await Promise.allSettled(uploadPromises)
  uploadedUrls.forEach((result) => {
    if (result.status === 'fulfilled') {
      mediaUrls.push(result.value.url)
    }
  })

  if (mediaUrls.length > 0) createData.mediaUrls = mediaUrls
  if (file) {
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'virtual-designs')
    createData.imageUrl = uploaded.url
    createData.cloudinaryId = uploaded.path
  } else if (!createData.imageUrl && mediaUrls.length > 0) {
    createData.imageUrl = mediaUrls[0]
  }

  if (circularFile) {
    const uploaded = await uploadFile(circularFile.buffer, circularFile.mimetype, 'virtual-designs')
    createData.homepageCircularImage = uploaded.url
    createData.homepageCircularImageId = uploaded.path
  }

  const item = await prisma.virtualDesign.create({ data: createData })
  return mapVD(item)
}

async function updateVirtualDesign(id, data, file, galleryFiles, circularFile = null) {
  const existing = await prisma.virtualDesign.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Virtual design not found')

  const updateData = { ...data }

  if (file) {
    if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'virtual-designs')
    updateData.imageUrl = uploaded.url
    updateData.cloudinaryId = uploaded.path
  }

  if (circularFile) {
    if (existing.homepageCircularImageId) await deleteFile(existing.homepageCircularImageId)
    const uploaded = await uploadFile(circularFile.buffer, circularFile.mimetype, 'virtual-designs')
    updateData.homepageCircularImage = uploaded.url
    updateData.homepageCircularImageId = uploaded.path
  }

  if (galleryFiles.length > 0) {
    const mediaUrls = [...(existing.mediaUrls || [])]
    const uploadPromises = []
    for (const f of galleryFiles) {
      uploadPromises.push(uploadFile(f.buffer, f.mimetype, 'virtual-designs'))
    }
    const uploadedUrls = await Promise.allSettled(uploadPromises)
    uploadedUrls.forEach((result) => {
      if (result.status === 'fulfilled') {
        mediaUrls.push(result.value.url)
      }
    })
    updateData.mediaUrls = mediaUrls
  }
  const item = await prisma.virtualDesign.update({ where: { id }, data: updateData })
  return mapVD(item)
}

async function deleteVirtualDesign(id) {
  try {
    const existing = await prisma.virtualDesign.findUnique({ where: { id } })
    if (!existing) throw failure(404, 'Virtual design not found')
    if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
    await prisma.virtualDesign.delete({ where: { id } })
  } catch (err) {
    if (err?.status === 404) throw err
    throw failure(500, 'Failed to delete virtual design')
  }
}
