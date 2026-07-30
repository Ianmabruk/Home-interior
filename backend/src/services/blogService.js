import { prisma } from '../config/database.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapBlog(item) {
  if (!item) return null
  return {
    ...item,
    _id: item.id,
    id: item.id,
    imageUrl: item.image,
    mediaUrl: item.image,
    mediaUrls: item.video ? [item.video] : [],
    mediaType: item.video ? 'video' : 'image',
  }
}

export const blogService = {
  listBlogs,
  listPublishedBlogs,
  getBlog,
  getPublishedBlog,
  createBlog,
  updateBlog,
  deleteBlog,
}

async function listBlogs() {
  try {
    const items = await prisma.blog.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    })
    return items.map(mapBlog)
  } catch {
    return []
  }
}

async function listPublishedBlogs() {
  try {
    const items = await prisma.blog.findMany({
      where: { published: true },
      orderBy: { displayOrder: 'asc', createdAt: 'desc' },
    })
    return items.map(mapBlog)
  } catch {
    return []
  }
}

async function getAllBlogs() {
  try {
    const items = await prisma.blog.findMany({
      orderBy: { displayOrder: 'asc', createdAt: 'desc' },
    })
    return items.map(mapBlog)
  } catch {
    return []
  }
}

async function getBlog(id) {
  try {
    const item = await prisma.blog.findUnique({ where: { id } })
    if (!item) throw failure(404, 'Blog not found')
    return mapBlog(item)
  } catch (err) {
    if (err?.status === 404) throw err
    throw failure(500, 'Failed to fetch blog')
  }
}

async function getPublishedBlog(id) {
  try {
    const item = await prisma.blog.findFirst({
      where: { id, published: true },
    })
    if (!item) throw failure(404, 'Blog not found')
    return mapBlog(item)
  } catch (err) {
    if (err?.status === 404) throw err
    throw failure(500, 'Failed to fetch blog')
  }
}

async function createBlog(data, imageFile, videoFile) {
  const createData = { ...data }

  if (imageFile) {
    const uploaded = await uploadFile(imageFile.buffer, imageFile.mimetype, 'blogs')
    createData.image = uploaded.url
    createData.cloudinaryId = uploaded.path
  }

  if (videoFile) {
    const uploaded = await uploadFile(videoFile.buffer, videoFile.mimetype, 'blogs')
    createData.video = uploaded.url
    if (!createData.cloudinaryId) {
      createData.cloudinaryId = uploaded.path
    }
  }

  const item = await prisma.blog.create({ data: createData })
  return mapBlog(item)
}

async function updateBlog(id, data, imageFile, videoFile) {
  const existing = await prisma.blog.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Blog not found')

  const updateData = { ...data }

  if (imageFile) {
    if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
    const uploaded = await uploadFile(imageFile.buffer, imageFile.mimetype, 'blogs')
    updateData.image = uploaded.url
    updateData.cloudinaryId = uploaded.path
  }

  if (videoFile) {
    if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
    const uploaded = await uploadFile(videoFile.buffer, videoFile.mimetype, 'blogs')
    updateData.video = uploaded.url
    updateData.cloudinaryId = uploaded.path
  }

  const item = await prisma.blog.update({ where: { id }, data: updateData })
  return mapBlog(item)
}

async function deleteBlog(id) {
  const existing = await prisma.blog.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Blog not found')
  if (existing.cloudinaryId) {
    try {
      await deleteFile(existing.cloudinaryId)
    } catch (fileErr) {
      console.error('[blogService] Failed to delete file for blog', id, fileErr)
    }
  }
  await prisma.blog.delete({ where: { id } })
}