import { prisma } from '../config/database.js'
import { uploadFile, deleteFile, deleteFiles } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

const MAX_GALLERY_MEDIA = 10

function mapVD(item) {
  const mediaAssets = Array.isArray(item.mediaAssets) ? item.mediaAssets : []
  const galleryMedia = (item.mediaUrls || []).map((url) => {
    const asset = mediaAssets.find((entry) => entry?.role === 'gallery' && entry.secureUrl === url)
      || mediaAssets.find((entry) => entry?.secureUrl === url)
    const isVideo = asset?.resourceType === 'video' || url.includes('/video/upload/')
    return {
      ...(asset || {}),
      url,
      type: isVideo ? 'video/mp4' : 'image',
      mediaType: isVideo ? 'video' : 'image',
      asset: asset || null,
    }
  })
  return {
    ...item,
    _id: item.id,
    id: item.id,
    mediaUrl: item.imageUrl,
    mediaType: item.mediaType,
    galleryMedia,
    mediaAssets,
    imageUrl: item.imageUrl,
    mediaUrls: item.mediaUrls,
    homepageCircularImage: item.homepageCircularImage,
    homepageCircularImageId: item.homepageCircularImageId,
    price: item.price,
    currency: item.currency,
    priceMax: item.priceMax,
    priceSuffix: item.priceSuffix,
    features: item.features || [],
    ctaText: item.ctaText,
    tagline: item.tagline,
    packageType: item.packageType,
  }
}

export const virtualDesignService = {
  listVirtualDesigns,
  getVirtualDesign,
  createVirtualDesign,
  updateVirtualDesign,
  deleteVirtualDesign,
}

async function listVirtualDesigns(filters = {}) {
    const where = {}
    if (filters.packageType) where.packageType = filters.packageType
    if (filters.published !== undefined) where.published = filters.published
    const items = await prisma.virtualDesign.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { displayOrder: 'asc' },
    })
    return items.map(mapVD)
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
  const mediaAssets = Array.isArray(data.mediaAssets) ? data.mediaAssets : []
  const mainAsset = mediaAssets.find((asset) => asset?.role === 'main')
  createData.mediaAssets = mediaAssets

  if (galleryFiles.length > MAX_GALLERY_MEDIA) {
    throw failure(400, `You can upload a maximum of ${MAX_GALLERY_MEDIA} gallery media files.`)
  }

  const mediaUrls = [...(Array.isArray(data.mediaUrls) ? data.mediaUrls : [])]
  let uploadedPaths = []

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

  if (mediaUrls.length > 0) createData.mediaUrls = [...new Set(mediaUrls)]
  if (file) {
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'virtual-designs')
    createData.imageUrl = uploaded.url
    createData.cloudinaryId = uploaded.path
    uploadedPaths.push(uploaded.path)
  } else if (mainAsset?.secureUrl && mainAsset?.publicId) {
    createData.imageUrl = mainAsset.secureUrl
    createData.cloudinaryId = mainAsset.publicId
  } else if (!createData.imageUrl && mediaUrls.length > 0) {
    createData.imageUrl = mediaUrls[0]
    const firstAsset = mediaAssets.find((asset) => asset?.secureUrl === mediaUrls[0])
    if (firstAsset?.resourceType === 'video') createData.mediaType = 'video'
  }

  if (circularFile) {
    const uploaded = await uploadFile(circularFile.buffer, circularFile.mimetype, 'virtual-designs')
    createData.homepageCircularImage = uploaded.url
    createData.homepageCircularImageId = uploaded.path
    uploadedPaths.push(uploaded.path)
  }

  let item
  try {
    item = await prisma.virtualDesign.create({ data: createData })
  } catch (err) {
    if (uploadedPaths.length > 0) {
      deleteFiles(uploadedPaths).catch(() => {})
    }
    throw err
  }
  return mapVD(item)
}

async function updateVirtualDesign(id, data, file, galleryFiles, circularFile = null) {
  const existing = await prisma.virtualDesign.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Virtual design not found')

  const updateData = { ...data }
  let newUploadedPaths = []
  const mediaAssets = Array.isArray(data.mediaAssets) ? data.mediaAssets : null
  const mainAsset = mediaAssets?.find((asset) => asset?.role === 'main')
  const replacedMainId = mainAsset?.publicId && existing.cloudinaryId !== mainAsset.publicId
    ? existing.cloudinaryId
    : null
  if (mediaAssets) updateData.mediaAssets = mediaAssets

  if (mainAsset?.secureUrl && mainAsset?.publicId) {
    updateData.imageUrl = mainAsset.secureUrl
    updateData.cloudinaryId = mainAsset.publicId
  }

  if (file) {
    if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'virtual-designs')
    updateData.imageUrl = uploaded.url
    updateData.cloudinaryId = uploaded.path
    newUploadedPaths.push(uploaded.path)
  }

  if (circularFile) {
    if (existing.homepageCircularImageId) await deleteFile(existing.homepageCircularImageId)
    const uploaded = await uploadFile(circularFile.buffer, circularFile.mimetype, 'virtual-designs')
    updateData.homepageCircularImage = uploaded.url
    updateData.homepageCircularImageId = uploaded.path
    newUploadedPaths.push(uploaded.path)
  }

  // Build the final mediaUrls: existing URLs the client wants to keep + newly uploaded files.
  // The client sends existingMediaUrls as a JSON array of URLs to retain.
  // This replaces the old mediaUrls entirely (no orphaned/stale URLs).
   const keptUrls = Array.isArray(data._keptMediaUrls) ? data._keptMediaUrls : []
   if (mediaAssets) {
     updateData.mediaAssets = mediaAssets.filter((asset) => (
       asset?.role === 'main' || keptUrls.includes(asset?.secureUrl)
     ))
   }

   if (galleryFiles.length > MAX_GALLERY_MEDIA) {
     throw failure(400, `You can upload a maximum of ${MAX_GALLERY_MEDIA} gallery media files.`)
   }

   if (keptUrls.length + galleryFiles.length > MAX_GALLERY_MEDIA) {
     throw failure(400, `A virtual design package can have a maximum of ${MAX_GALLERY_MEDIA} gallery media items. You currently have ${keptUrls.length}, so you can add ${Math.max(0, MAX_GALLERY_MEDIA - keptUrls.length)} more.`)
   }

  // Clean up gallery files that were removed during update
  if (data._keptMediaUrls !== undefined) {
    const removedUrls = (existing.mediaUrls || []).filter(url => !keptUrls.includes(url))
    if (removedUrls.length > 0) {
      await deleteFiles(removedUrls)
    }
  }

  if (galleryFiles.length > 0) {
    const uploadPromises = []
    for (const f of galleryFiles) {
      uploadPromises.push(uploadFile(f.buffer, f.mimetype, 'virtual-designs'))
    }
    const uploadedUrls = await Promise.allSettled(uploadPromises)
    const newUrls = []
    uploadedUrls.forEach((result) => {
      if (result.status === 'fulfilled') {
        newUrls.push(result.value.url)
      }
    })
    updateData.mediaUrls = [...keptUrls, ...newUrls]
  } else if (data._keptMediaUrls !== undefined) {
    // No new files, but the client explicitly sent the list of URLs to keep
    updateData.mediaUrls = keptUrls
  }

  let item
  try {
    item = await prisma.virtualDesign.update({ where: { id }, data: updateData })
  } catch (err) {
    if (newUploadedPaths.length > 0) {
      deleteFiles(newUploadedPaths).catch(() => {})
    }
    throw err
  }
  if (replacedMainId) {
    await deleteFile(replacedMainId, existing.mediaType === 'video' ? 'video' : 'image')
  }
  return mapVD(item)
}

async function deleteVirtualDesign(id) {
  try {
    const existing = await prisma.virtualDesign.findUnique({ where: { id } })
    if (!existing) throw failure(404, 'Virtual design not found')
    if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId, existing.mediaType === 'video' ? 'video' : 'image')
    // Clean up gallery files
    if (existing.mediaUrls && existing.mediaUrls.length > 0) {
      await deleteFiles(existing.mediaUrls)
    }
    await prisma.virtualDesign.delete({ where: { id } })
  } catch (err) {
    if (err?.status === 404) throw err
    throw failure(500, 'Failed to delete virtual design')
  }
}
