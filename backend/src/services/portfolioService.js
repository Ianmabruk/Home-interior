import { prisma } from '../config/database.js'
import { uploadFile, deleteFile, deleteFiles } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

const MAX_IMAGES_PER_SECTION = 21

function mapPortfolio(item) {
  if (!item) return null
  return {
    _id: item.id,
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    featured: item.featured,
    displayOrder: item.displayOrder,
    published: item.published,
    imageUrl: item.imageUrl,
    mediaUrl: item.imageUrl,
    cloudinaryId: item.cloudinaryId,
    mediaUrls: item.mediaUrls || [],
    galleryImages: item.mediaUrls || [],
    beforeImages: item.beforeImages || [],
    afterImages: item.afterImages || [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export const portfolioService = {
  listPortfolio,
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
}

async function listPortfolio({ sort = '-createdAt', limit = 100 } = {}) {
  try {
    const orderBy = sort?.startsWith('-') ? { [sort.slice(1)]: 'desc' } : { createdAt: 'asc' }
    const items = await prisma.portfolioProject.findMany({
      orderBy,
      take: Number(limit) || 100,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        featured: true,
        displayOrder: true,
        published: true,
        imageUrl: true,
        cloudinaryId: true,
        mediaUrls: true,
        beforeImages: true,
        afterImages: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return items.map(mapPortfolio)
  } catch {
    return []
  }
}

async function getPortfolio(id) {
  try {
    const item = await prisma.portfolioProject.findUnique({ where: { id } })
    if (!item) throw failure(404, 'Portfolio item not found')
    return mapPortfolio(item)
  } catch (err) {
    if (err?.status === 404) throw err
    throw failure(500, 'Failed to fetch portfolio item')
  }
}

async function uploadImageFiles(files, folder) {
  const urls = []
  const errors = []
  const uploadResults = await Promise.allSettled(
    files.map((f) => uploadFile(f.buffer, f.mimetype, folder)),
  )
  uploadResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      urls.push(result.value.url)
    } else {
      const file = files[index]
      const reason = result.reason?.message || 'Unknown upload error'
      errors.push({ file: file?.originalname || `file_${index}`, error: reason })
    }
  })
  return { urls, errors }
}

async function createPortfolio(data, file, galleryFiles = [], beforeFiles = [], afterFiles = []) {
  const createData = { ...data }
  const mediaUrls = []
  const beforeImages = [...(data.beforeImages || [])]
  const afterImages = [...(data.afterImages || [])]

  if (galleryFiles.length > MAX_IMAGES_PER_SECTION) {
    throw failure(400, `Gallery: Maximum ${MAX_IMAGES_PER_SECTION} images allowed`)
  }
  if (beforeFiles.length > MAX_IMAGES_PER_SECTION) {
    throw failure(400, `Before: Maximum ${MAX_IMAGES_PER_SECTION} images allowed`)
  }
  if (afterFiles.length > MAX_IMAGES_PER_SECTION) {
    throw failure(400, `After: Maximum ${MAX_IMAGES_PER_SECTION} images allowed`)
  }

  if (galleryFiles.length > 0) {
    const { urls, errors } = await uploadImageFiles(galleryFiles, 'portfolio')
    if (errors.length > 0) {
      const errorDetails = errors.map((e) => `${e.file}: ${e.error}`).join('; ')
      throw failure(400, `Gallery upload failed: ${errorDetails}`)
    }
    mediaUrls.push(...urls)
  }

  if (beforeFiles.length > 0) {
    const { urls, errors } = await uploadImageFiles(beforeFiles, 'portfolio/before')
    if (errors.length > 0) {
      const errorDetails = errors.map((e) => `${e.file}: ${e.error}`).join('; ')
      throw failure(400, `Before upload failed: ${errorDetails}`)
    }
    beforeImages.push(...urls)
  }

  if (afterFiles.length > 0) {
    const { urls, errors } = await uploadImageFiles(afterFiles, 'portfolio/after')
    if (errors.length > 0) {
      const errorDetails = errors.map((e) => `${e.file}: ${e.error}`).join('; ')
      throw failure(400, `After upload failed: ${errorDetails}`)
    }
    afterImages.push(...urls)
  }

  if (mediaUrls.length > 0) createData.mediaUrls = mediaUrls
  if (beforeImages.length > 0) createData.beforeImages = beforeImages
  if (afterImages.length > 0) createData.afterImages = afterImages

  if (file) {
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'portfolio')
    createData.imageUrl = uploaded.url
    createData.cloudinaryId = uploaded.path
  } else if (!createData.imageUrl && (mediaUrls.length > 0 || beforeImages.length > 0)) {
    createData.imageUrl = mediaUrls[0] || beforeImages[0]
  }

  const item = await prisma.portfolioProject.create({ data: createData })
  return mapPortfolio(item)
}

async function updatePortfolio(id, data, file, galleryFiles = [], beforeFiles = [], afterFiles = []) {
  const existing = await prisma.portfolioProject.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Portfolio item not found')

  const updateData = { ...data }

  if (file) {
    if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'portfolio')
    updateData.imageUrl = uploaded.url
    updateData.cloudinaryId = uploaded.path
  }

  const mediaUrls = updateData.mediaUrls || [...(existing.mediaUrls || [])]
  if (galleryFiles.length > 0) {
    if (galleryFiles.length > MAX_IMAGES_PER_SECTION) {
      throw failure(400, `Gallery: Maximum ${MAX_IMAGES_PER_SECTION} images allowed`)
    }
    const { urls, errors } = await uploadImageFiles(galleryFiles, 'portfolio')
    if (errors.length > 0) {
      const errorDetails = errors.map(e => `${e.file}: ${e.error}`).join('; ')
      throw failure(400, `Some gallery uploads failed: ${errorDetails}`)
    }
    mediaUrls.push(...urls)
  }

  if (mediaUrls.length > MAX_IMAGES_PER_SECTION) {
    mediaUrls.splice(MAX_IMAGES_PER_SECTION)
  }
  updateData.mediaUrls = mediaUrls

  const beforeImages = updateData.beforeImages || [...(existing.beforeImages || [])]
  if (beforeFiles.length > 0) {
    if (beforeFiles.length > MAX_IMAGES_PER_SECTION) {
      throw failure(400, `Before: Maximum ${MAX_IMAGES_PER_SECTION} images allowed`)
    }
    const { urls, errors } = await uploadImageFiles(beforeFiles, 'portfolio/before')
    if (errors.length > 0) {
      const errorDetails = errors.map(e => `${e.file}: ${e.error}`).join('; ')
      throw failure(400, `Some before uploads failed: ${errorDetails}`)
    }
    beforeImages.push(...urls)
  }

  if (beforeImages.length > MAX_IMAGES_PER_SECTION) {
    beforeImages.splice(MAX_IMAGES_PER_SECTION)
  }
  updateData.beforeImages = beforeImages

  const afterImages = updateData.afterImages || [...(existing.afterImages || [])]
  if (afterFiles.length > 0) {
    if (afterFiles.length > MAX_IMAGES_PER_SECTION) {
      throw failure(400, `After: Maximum ${MAX_IMAGES_PER_SECTION} images allowed`)
    }
    const { urls, errors } = await uploadImageFiles(afterFiles, 'portfolio/after')
    if (errors.length > 0) {
      const errorDetails = errors.map(e => `${e.file}: ${e.error}`).join('; ')
      throw failure(400, `Some after uploads failed: ${errorDetails}`)
    }
    afterImages.push(...urls)
  }

  if (afterImages.length > MAX_IMAGES_PER_SECTION) {
    afterImages.splice(MAX_IMAGES_PER_SECTION)
  }
  updateData.afterImages = afterImages

  const item = await prisma.portfolioProject.update({ where: { id }, data: updateData })
  return mapPortfolio(item)
}

async function deletePortfolio(id) {
  const existing = await prisma.portfolioProject.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Portfolio item not found')
  if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
  await deleteFiles([...(existing.mediaUrls || []), ...(existing.beforeImages || []), ...(existing.afterImages || [])])
  await prisma.portfolioProject.delete({ where: { id } })
}
