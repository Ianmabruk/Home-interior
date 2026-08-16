import { prisma } from '../config/database.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapWorkWithUs(item) {
  if (!item) return null
  return {
    ...item,
    _id: item.id,
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    imageUrl: item.imageUrl,
    mediaUrls: item.mediaUrls,
    cloudinaryId: item.cloudinaryId,
    fullName: item.fullName,
    phone: item.phone,
    email: item.email,
    budget: item.budget,
    startDate: item.startDate,
    timeline: item.timeline,
    status: item.status,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
  }
}

export const workWithUsService = {
  listWorkWithUs,
  getWorkWithUs,
  createWorkWithUs,
  // updateWorkWithUs - not implemented (pre-existing gap)
  updateWorkWithUsStatus,
  deleteWorkWithUs,
  getWorkWithUsContent,
  createWorkWithUsContent,
  updateWorkWithUsContent,
  deleteWorkWithUsContent,
}

async function listWorkWithUs() {
  try {
    const items = await prisma.workWithUs.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return items.map(mapWorkWithUs)
  } catch {
    return []
  }
}

async function getWorkWithUs(id) {
  try {
    const item = await prisma.workWithUs.findUnique({ where: { id } })
    if (!item) throw failure(404, 'Submission not found')
    return mapWorkWithUs(item)
  } catch (err) {
    if (err?.status === 404) throw err
    throw failure(500, 'Failed to fetch submission')
  }
}

async function createWorkWithUs(data) {
  const item = await prisma.workWithUs.create({ data })
  return mapWorkWithUs(item)
}

async function updateWorkWithUsStatus(id, status) {
  const item = await prisma.workWithUs.update({
    where: { id },
    data: { status },
  })
  return mapWorkWithUs(item)
}

async function deleteWorkWithUs(id) {
  const existing = await prisma.workWithUs.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Submission not found')
  await prisma.workWithUs.delete({ where: { id } })
}

async function getWorkWithUsContent() {
  try {
    const items = await prisma.workWithUs.findMany({
      where: { type: 'content', isActive: true },
      orderBy: { displayOrder: 'asc' },
    })
    return items.map(mapWorkWithUs)
  } catch {
    return []
  }
}

async function createWorkWithUsContent(data, file) {
  const uploadData = {}
  if (file) {
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'work-with-us')
    uploadData.imageUrl = uploaded.url
    uploadData.cloudinaryId = uploaded.path
  }
  const item = await prisma.workWithUs.create({
    data: {
      type: 'content',
      title: data.title || '',
      description: data.description || '',
      displayOrder: data.displayOrder || 0,
      isActive: data.isActive !== false,
      ...uploadData,
    },
  })
  return mapWorkWithUs(item)
}

async function updateWorkWithUsContent(id, data, file) {
  const existing = await prisma.workWithUs.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Content not found')

  const updateData = { ...data }

  if (file) {
    if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'work-with-us')
    updateData.imageUrl = uploaded.url
    updateData.cloudinaryId = uploaded.path
  }

  const item = await prisma.workWithUs.update({
    where: { id },
    data: updateData,
  })
  return mapWorkWithUs(item)
}

async function deleteWorkWithUsContent(id) {
  const existing = await prisma.workWithUs.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Content not found')
  if (existing.cloudinaryId) {
    await deleteFile(existing.cloudinaryId)
  }
  await prisma.workWithUs.delete({ where: { id } })
  return { success: true }
}
