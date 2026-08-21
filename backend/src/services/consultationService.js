import { prisma } from '../config/database.js'
import { failure } from '../utils/response.js'

function mapConsultation(item) {
  if (!item) return null
  return {
    ...item,
    _id: item.id,
    id: item.id,
    type: item.type,
    status: item.status,
    createdAt: item.createdAt,
    preferredDate: item.preferredDate,
    preferredTime: item.preferredTime,
    projectType: item.projectType,
    budget: item.budget,
    timeline: item.timeline,
    packageName: item.packageName,
    packagePrice: item.packagePrice,
    paymentStatus: item.paymentStatus,
    orderId: item.orderId,
    purchaseDate: item.purchaseDate,
  }
}

function mapPublicConsultation(item) {
  if (!item) return null
  return {
    id: item.id,
    type: item.type,
    status: item.status,
    createdAt: item.createdAt,
    preferredDate: item.preferredDate,
    preferredTime: item.preferredTime,
    projectType: item.projectType,
    budget: item.budget,
    timeline: item.timeline,
    packageName: item.packageName,
    packagePrice: item.packagePrice,
    paymentStatus: item.paymentStatus,
    orderId: item.orderId,
    purchaseDate: item.purchaseDate,
  }
}

export const consultationService = {
  listConsultations,
  listPublicConsultations,
  getConsultation,
  createConsultation,
  updateConsultationStatus,
  deleteConsultation,
}

async function listPublicConsultations({ status, search, page = 1, pageSize = 10, type, paymentStatus } = {}) {
  try {
    const where = {}
    if (status && status !== 'all') where.status = status
    if (type && type !== 'all') where.type = type
    if (paymentStatus && paymentStatus !== 'all') where.paymentStatus = paymentStatus
    if (search) {
      where.OR = [
        { projectType: { contains: search } },
        { budget: { contains: search } },
        { timeline: { contains: search } },
      ]
    }

    const safePage = Number(page) || 1
    const safePageSize = Number(pageSize) || 10
    const [items, total] = await Promise.all([
      prisma.consultation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
        select: {
          id: true,
          type: true,
          status: true,
          createdAt: true,
          preferredDate: true,
          preferredTime: true,
          projectType: true,
          budget: true,
          timeline: true,
          packageName: true,
          packagePrice: true,
          paymentStatus: true,
          orderId: true,
          purchaseDate: true,
        },
      }),
      prisma.consultation.count({ where }),
    ])

    return {
      items: items.map(mapPublicConsultation),
      total,
      totalPages: Math.ceil(total / safePageSize),
    }
  } catch {
    return { items: [], total: 0, totalPages: 0 }
  }
}

async function listConsultations({ status, search, page = 1, pageSize = 10, type, paymentStatus } = {}) {
  try {
    const where = {}
    if (status && status !== 'all') where.status = status
    if (type && type !== 'all') where.type = type
    if (paymentStatus && paymentStatus !== 'all') where.paymentStatus = paymentStatus
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { message: { contains: search } },
      ]
    }

    const safePage = Number(page) || 1
    const safePageSize = Number(pageSize) || 10
    const [items, total] = await Promise.all([
      prisma.consultation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
      }),
      prisma.consultation.count({ where }),
    ])

    return {
      items: items.map(mapConsultation),
      total,
      totalPages: Math.ceil(total / safePageSize),
    }
  } catch {
    return { items: [], total: 0, totalPages: 0 }
  }
}

async function getConsultation(id) {
  const item = await prisma.consultation.findUnique({ where: { id } })
  if (!item) throw failure(404, 'Consultation not found')
  return mapConsultation(item)
}

async function createConsultation(data) {
  const consultation = await prisma.consultation.create({ data })
  return mapConsultation(consultation)
}

async function updateConsultationStatus(id, status) {
  const item = await prisma.consultation.update({
    where: { id },
    data: { status },
  })
  return mapConsultation(item)
}

async function deleteConsultation(id) {
  const existing = await prisma.consultation.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Consultation not found')
  await prisma.consultation.delete({ where: { id } })
}
