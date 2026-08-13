import { prisma } from '../config/database.js'
import { failure } from '../utils/response.js'

function mapWorkWithUs(item) {
  if (!item) return null
  return {
    ...item,
    _id: item.id,
    id: item.id,
    fullName: item.fullName,
    phone: item.phone,
    email: item.email,
    budget: item.budget,
    startDate: item.startDate,
    timeline: item.timeline,
    status: item.status,
  }
}

export const workWithUsService = {
  listWorkWithUs,
  getWorkWithUs,
  createWorkWithUs,
  updateWorkWithUsStatus,
  deleteWorkWithUs,
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
