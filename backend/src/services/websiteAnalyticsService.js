import { prisma } from '../config/database.js'

function sanitizeText(value, maxLength = 2000) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  if (!text) return null
  return text.slice(0, maxLength)
}

export const websiteAnalyticsService = {
  trackVisit,
  getInsights,
}

export async function trackVisit(payload = {}) {
  const path = sanitizeText(payload.path || '/', 255) || '/'
  const url = sanitizeText(payload.url, 2048)
  const referrer = sanitizeText(payload.referrer, 2048)
  const pageTitle = sanitizeText(payload.title, 200)
  const sessionId = sanitizeText(payload.sessionId, 255)
  const userAgent = sanitizeText(payload.userAgent, 500)
  const ipHash = sanitizeText(payload.ipHash, 255)

  return prisma.websiteVisit.create({
    data: {
      path,
      url,
      referrer,
      pageTitle,
      sessionId,
      userAgent,
      ipHash,
    },
  })
}

export async function getInsights() {
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - 6)
  startOfWeek.setHours(0, 0, 0, 0)

  const [totalVisits, todayVisits, weekVisits, topPages, recentVisits] = await Promise.all([
    prisma.websiteVisit.count(),
    prisma.websiteVisit.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.websiteVisit.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.websiteVisit.groupBy({
      by: ['path'],
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 8,
    }),
    prisma.websiteVisit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        path: true,
        pageTitle: true,
        createdAt: true,
      },
    }),
  ])

  return {
    totalVisits,
    todayVisits,
    weekVisits,
    topPages: topPages.map((entry) => ({
      path: entry.path,
      visits: entry._count.path,
    })),
    recentVisits: recentVisits.map((visit) => ({
      path: visit.path,
      pageTitle: visit.pageTitle || 'Untitled page',
      createdAt: visit.createdAt,
    })),
  }
}
