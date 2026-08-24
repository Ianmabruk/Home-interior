import { prisma } from '../config/database.js'
import { uploadFile, deleteFile, deleteFiles } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

const MAX_IMAGES_PER_SECTION = 21

async function syncPortfolioImages(projectId, beforeImages, afterImages) {
  const before = beforeImages.map((url, idx) => ({
    portfolioProjectId: projectId,
    imageUrl: url,
    imageType: 'before',
    sortOrder: idx,
  }))
  const after = afterImages.map((url, idx) => ({
    portfolioProjectId: projectId,
    imageUrl: url,
    imageType: 'after',
    sortOrder: idx,
  }))
  const all = [...before, ...after]

  if (all.length === 0) return

  await prisma.$transaction(async (tx) => {
    const existing = await tx.portfolioImage.findMany({
      where: { portfolioProjectId: projectId },
      select: { id: true, imageUrl: true, imageType: true },
    })
    const existingKeys = new Set(existing.map((img) => `${img.imageType}:${img.imageUrl}`))
    const existingIdsToDelete = existing.filter((img) => {
      const key = `${img.imageType}:${img.imageUrl}`
      return !all.some((newImg) => newImg.imageType === img.imageType && newImg.imageUrl === img.imageUrl)
    }).map((img) => img.id)

    if (existingIdsToDelete.length > 0) {
      await tx.portfolioImage.deleteMany({ where: { id: { in: existingIdsToDelete } } })
    }

    for (const newImg of all) {
      const key = `${newImg.imageType}:${newImg.imageUrl}`
      if (!existingKeys.has(key)) {
        await tx.portfolioImage.create({ data: newImg })
      }
    }
  })
}

function mapPortfolio(item, portfolioImages = []) {
  if (!item) return null

  const beforeImages = portfolioImages
    .filter((img) => img.imageType === 'before')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => img.imageUrl)

  const afterImages = portfolioImages
    .filter((img) => img.imageType === 'after')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => img.imageUrl)

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
    beforeImages: beforeImages.length > 0 ? beforeImages : (item.beforeImages || []),
    afterImages: afterImages.length > 0 ? afterImages : (item.afterImages || []),
    portfolioImages: portfolioImages
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        imageType: img.imageType,
        sortOrder: img.sortOrder,
        cloudinaryId: img.cloudinaryId,
      })),
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
  reorderPortfolioImages,
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
    const result = await Promise.all(
      items.map(async (item) => {
        const portfolioImages = await prisma.portfolioImage.findMany({
          where: { portfolioProjectId: item.id },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, imageUrl: true, imageType: true, sortOrder: true, cloudinaryId: true },
        })
        return mapPortfolio(item, portfolioImages)
      }),
    )
    return result
  } catch (err) {
    console.error('[portfolioService] listPortfolio error:', err?.message || err)
    return []
  }
}

async function getPortfolio(id) {
  try {
    const item = await prisma.portfolioProject.findUnique({ where: { id } })
    if (!item) throw failure(404, 'Portfolio item not found')
    const portfolioImages = await prisma.portfolioImage.findMany({
      where: { portfolioProjectId: item.id },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, imageUrl: true, imageType: true, sortOrder: true, cloudinaryId: true },
    })
    return mapPortfolio(item, portfolioImages)
  } catch (err) {
    if (err?.status === 404) throw err
    throw failure(500, 'Failed to fetch portfolio item')
  }
}

async function uploadImageFiles(files, folder) {
  const tStart = Date.now()
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
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[portfolioService] uploadImageFiles: ${files.length} files to ${folder} in ${Date.now() - tStart}ms (urls=${urls.length}, errors=${errors.length})`)
  }
  return { urls, errors }
}

async function createPortfolio(data, file, beforeFiles = [], afterFiles = [], circularFile = null) {
  const tStart = Date.now()
  const createData = { ...data }

  if (beforeFiles.length > MAX_IMAGES_PER_SECTION) {
    throw failure(400, `Before: Maximum ${MAX_IMAGES_PER_SECTION} images allowed`)
  }
  if (afterFiles.length > MAX_IMAGES_PER_SECTION) {
    throw failure(400, `After: Maximum ${MAX_IMAGES_PER_SECTION} images allowed`)
  }

  const beforeImages = [...(data.beforeImages || [])]
  const afterImages = [...(data.afterImages || [])]

  const uploadStart = Date.now()
  const [beforeResult, afterResult, mainResult, circularResult] = await Promise.allSettled([
    beforeFiles.length > 0 ? uploadImageFiles(beforeFiles, 'portfolio/before') : Promise.resolve({ urls: [], errors: [] }),
    afterFiles.length > 0 ? uploadImageFiles(afterFiles, 'portfolio/after') : Promise.resolve({ urls: [], errors: [] }),
    file ? uploadFile(file.buffer, file.mimetype, 'portfolio') : Promise.resolve(null),
    circularFile ? uploadFile(circularFile.buffer, circularFile.mimetype, 'portfolio') : Promise.resolve(null),
  ])
  const uploadElapsed = Date.now() - uploadStart

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

  const dbStart = Date.now()
  const item = await prisma.portfolioProject.create({ data: createData })
  const dbElapsed = Date.now() - dbStart

  await syncPortfolioImages(item.id, beforeImages, afterImages)

  const total = Date.now() - tStart
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[portfolioService] createPortfolio: upload=${uploadElapsed}ms db=${dbElapsed}ms total=${total}ms (before=${beforeFiles.length}, after=${afterFiles.length}, main=${!!file})`)
  } else if (total > 5000) {
    console.warn(`[portfolioService] createPortfolio slow: upload=${uploadElapsed}ms db=${dbElapsed}ms total=${total}ms`)
  }

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

  const uploadResults = await Promise.allSettled(uploadPromises)

  const failedUploads = uploadResults.filter((r) => r.status === 'rejected')
  if (failedUploads.length > 0) {
    const reasons = failedUploads.map((r) => r.reason?.message || 'Unknown error').join('; ')
    throw failure(500, `Upload failed: ${reasons}`)
  }

  if (beforeImages.length > MAX_IMAGES_PER_SECTION) {
    beforeImages.splice(MAX_IMAGES_PER_SECTION)
  }
  updateData.beforeImages = beforeImages

  if (afterImages.length > MAX_IMAGES_PER_SECTION) {
    afterImages.splice(MAX_IMAGES_PER_SECTION)
  }
  updateData.afterImages = afterImages

   const item = await prisma.portfolioProject.update({ where: { id }, data: updateData })

  await syncPortfolioImages(id, beforeImages, afterImages)

  const portfolioImages = await prisma.portfolioImage.findMany({
    where: { portfolioProjectId: id },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, imageUrl: true, imageType: true, sortOrder: true, cloudinaryId: true },
  })
  return mapPortfolio(item, portfolioImages)
}

async function deletePortfolio(id) {
  const existing = await prisma.portfolioProject.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Portfolio item not found')
  if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
  await deleteFiles([...(existing.beforeImages || []), ...(existing.afterImages || [])])
  await prisma.portfolioImage.deleteMany({ where: { portfolioProjectId: id } })
  await prisma.portfolioProject.delete({ where: { id } })
}

async function reorderPortfolioImages(projectId, orderList) {
  const project = await prisma.portfolioProject.findUnique({ where: { id: projectId } })
  if (!project) throw failure(404, 'Portfolio item not found')

  const existingImages = await prisma.portfolioImage.findMany({
    where: { portfolioProjectId: projectId },
    select: { id: true, imageUrl: true, imageType: true, sortOrder: true },
  })

  const existingById = new Map(existingImages.map((img) => [img.id, img]))
  const existingByUrl = new Map(existingImages.map((img) => [`${img.imageType}:${img.imageUrl}`, img]))
  const seenIds = new Set()
  const seenUrls = new Set()

  for (const item of orderList) {
    if (item.id !== undefined) {
      if (seenIds.has(item.id)) {
        throw failure(400, `Duplicate image ID: ${item.id}`)
      }
      seenIds.add(item.id)
      if (!existingById.has(item.id)) {
        throw failure(400, `Unknown image ID: ${item.id}`)
      }
    } else if (item.imageUrl !== undefined) {
      const key = `${item.imageType || 'before'}:${item.imageUrl}`
      if (seenUrls.has(key)) {
        throw failure(400, `Duplicate image URL: ${item.imageUrl}`)
      }
      seenUrls.add(key)
      if (!existingByUrl.has(key)) {
        throw failure(400, `Unknown image URL for type ${item.imageType}: ${item.imageUrl}`)
      }
    }

    if (item.sortOrder < 0) {
      throw failure(400, `Sort order must be non-negative: ${item.sortOrder}`)
    }
    if (item.imageType !== 'before' && item.imageType !== 'after') {
      throw failure(400, `Invalid image type: ${item.imageType}`)
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const item of orderList) {
      let where
      if (item.id !== undefined) {
        where = { id: item.id }
      } else {
        const existing = await tx.portfolioImage.findFirst({
          where: {
            portfolioProjectId: projectId,
            imageType: item.imageType,
            imageUrl: item.imageUrl,
          },
        })
        if (!existing) {
          throw failure(400, `Image not found for type ${item.imageType}: ${item.imageUrl}`)
        }
        where = { id: existing.id }
      }
      await tx.portfolioImage.update({
        where,
        data: { sortOrder: item.sortOrder },
      })
    }
  })

  const updatedImages = await prisma.portfolioImage.findMany({
    where: { portfolioProjectId: projectId },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, imageUrl: true, imageType: true, sortOrder: true, cloudinaryId: true },
  })

  const projectAfter = await prisma.portfolioProject.findUnique({ where: { id: projectId } })
  return mapPortfolio(projectAfter, updatedImages)
}
