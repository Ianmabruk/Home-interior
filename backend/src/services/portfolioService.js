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
    homepageCircularImage: item.homepageCircularImage,
    homepageCircularImageId: item.homepageCircularImageId,
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

async function createPortfolio(data, file, beforeFiles = [], afterFiles = [], circularFile = null) {
  const createData = { ...data }

  if (beforeFiles.length > MAX_IMAGES_PER_SECTION) {
    throw failure(400, `Before: Maximum ${MAX_IMAGES_PER_SECTION} images allowed`)
  }
  if (afterFiles.length > MAX_IMAGES_PER_SECTION) {
    throw failure(400, `After: Maximum ${MAX_IMAGES_PER_SECTION} images allowed`)
  }

  const beforeImages = [...(data.beforeImages || [])]
  const afterImages = [...(data.afterImages || [])]

  const [beforeResult, afterResult, mainResult, circularResult] = await Promise.allSettled([
    beforeFiles.length > 0 ? uploadImageFiles(beforeFiles, 'portfolio/before') : Promise.resolve({ urls: [], errors: [] }),
    afterFiles.length > 0 ? uploadImageFiles(afterFiles, 'portfolio/after') : Promise.resolve({ urls: [], errors: [] }),
    file ? uploadFile(file.buffer, file.mimetype, 'portfolio') : Promise.resolve(null),
    circularFile ? uploadFile(circularFile.buffer, circularFile.mimetype, 'portfolio') : Promise.resolve(null),
  ])

  if (beforeResult.status === 'rejected') {
    throw failure(500, `Before upload failed: ${beforeResult.reason?.message || 'Unknown error'}`)
  }
  if (afterResult.status === 'rejected') {
    throw failure(500, `After upload failed: ${afterResult.reason?.message || 'Unknown error'}`)
  }
  if (mainResult.status === 'rejected') {
    throw failure(500, `Main image upload failed: ${mainResult.reason?.message || 'Unknown error'}`)
  }
  if (circularResult.status === 'rejected') {
    throw failure(500, `Circular tab image upload failed: ${circularResult.reason?.message || 'Unknown error'}`)
  }

  const { urls: beforeUrls, errors: beforeErrors } = beforeResult.value
  const { urls: afterUrls, errors: afterErrors } = afterResult.value
  const mainUploaded = mainResult.value
  const circularUploaded = circularResult.value

  if (beforeErrors.length > 0) {
    const errorDetails = beforeErrors.map((e) => `${e.file}: ${e.error}`).join('; ')
    throw failure(400, `Before upload failed: ${errorDetails}`)
  }
  if (afterErrors.length > 0) {
    const errorDetails = afterErrors.map((e) => `${e.file}: ${e.error}`).join('; ')
    throw failure(400, `After upload failed: ${errorDetails}`)
  }

  beforeImages.push(...beforeUrls)
  afterImages.push(...afterUrls)

  if (beforeImages.length > 0) createData.beforeImages = beforeImages
  if (afterImages.length > 0) createData.afterImages = afterImages

  if (mainUploaded) {
    createData.imageUrl = mainUploaded.url
    createData.cloudinaryId = mainUploaded.path
  } else if (!createData.imageUrl && (beforeImages.length > 0 || afterImages.length > 0)) {
    createData.imageUrl = beforeImages[0] || afterImages[0]
  }

  if (circularUploaded) {
    createData.homepageCircularImage = circularUploaded.url
    createData.homepageCircularImageId = circularUploaded.path
  }

  const item = await prisma.portfolioProject.create({ data: createData })
  return mapPortfolio(item)
}

async function updatePortfolio(id, data, file, beforeFiles = [], afterFiles = [], circularFile = null) {
  const existing = await prisma.portfolioProject.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Portfolio item not found')

  const updateData = { ...data }

  const beforeImages = updateData.beforeImages || [...(existing.beforeImages || [])]
  const afterImages = updateData.afterImages || [...(existing.afterImages || [])]

  const uploadPromises = []

  if (file) {
    if (existing.cloudinaryId) uploadPromises.push(deleteFile(existing.cloudinaryId))
    uploadPromises.push(
      uploadFile(file.buffer, file.mimetype, 'portfolio').then((uploaded) => {
        updateData.imageUrl = uploaded.url
        updateData.cloudinaryId = uploaded.path
      }),
    )
  }

  if (circularFile) {
    if (existing.homepageCircularImageId) uploadPromises.push(deleteFile(existing.homepageCircularImageId))
    uploadPromises.push(
      uploadFile(circularFile.buffer, circularFile.mimetype, 'portfolio').then((uploaded) => {
        updateData.homepageCircularImage = uploaded.url
        updateData.homepageCircularImageId = uploaded.path
      }),
    )
  }

  if (beforeFiles.length > 0) {
    if (beforeFiles.length > MAX_IMAGES_PER_SECTION) {
      throw failure(400, `Before: Maximum ${MAX_IMAGES_PER_SECTION} images allowed`)
    }
    uploadPromises.push(
      uploadImageFiles(beforeFiles, 'portfolio/before').then(({ urls, errors }) => {
        if (errors.length > 0) {
          const errorDetails = errors.map((e) => `${e.file}: ${e.error}`).join('; ')
          throw failure(400, `Some before uploads failed: ${errorDetails}`)
        }
        beforeImages.push(...urls)
      }),
    )
  }

  if (afterFiles.length > 0) {
    if (afterFiles.length > MAX_IMAGES_PER_SECTION) {
      throw failure(400, `After: Maximum ${MAX_IMAGES_PER_SECTION} images allowed`)
    }
    uploadPromises.push(
      uploadImageFiles(afterFiles, 'portfolio/after').then(({ urls, errors }) => {
        if (errors.length > 0) {
          const errorDetails = errors.map((e) => `${e.file}: ${e.error}`).join('; ')
          throw failure(400, `Some after uploads failed: ${errorDetails}`)
        }
        afterImages.push(...urls)
      }),
    )
  }

  await Promise.allSettled(uploadPromises)

  if (beforeImages.length > MAX_IMAGES_PER_SECTION) {
    beforeImages.splice(MAX_IMAGES_PER_SECTION)
  }
  updateData.beforeImages = beforeImages

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
  await deleteFiles([...(existing.beforeImages || []), ...(existing.afterImages || [])])
  await prisma.portfolioProject.delete({ where: { id } })
}
