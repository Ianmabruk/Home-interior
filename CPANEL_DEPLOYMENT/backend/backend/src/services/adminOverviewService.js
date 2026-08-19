import { prisma } from '../config/database.js'

export const adminOverviewService = {
  getAdminOverview,
  getSettings,
  updateSettings,
}

export async function getAdminOverview() {
  const [
    portfolioCount,
    productCount,
    orderCount,
    consultationCount,
    heroCount,
    virtualCount,
    serviceCount,
    blogCount,
    blogPublishedCount,
    blogDraftCount,
    imageCount,
    videoCount,
    totalViews,
    customerCount,
    revenue,
  ] = await Promise.all([
    prisma.portfolioProject.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.consultation.count(),
    prisma.heroMedia.count(),
    prisma.virtualDesign.count(),
    prisma.service.count(),
    prisma.blog.count(),
    prisma.blog.count({ where: { published: true } }),
    prisma.blog.count({ where: { published: false } }),
    prisma.blog.count({ where: { image: { not: null } } }),
    prisma.blog.count({ where: { video: { not: null } } }),
    prisma.blog.aggregate({ _sum: { views: true } }),
    prisma.order.groupBy({
      by: ['email'],
      _count: { email: true },
    }).then((groups) => groups.length),
    prisma.order.aggregate({ _sum: { total: true } }).then((r) => r._sum.total || 0),
  ])

  return {
    portfolioCount,
    productCount,
    orderCount,
    consultationCount,
    heroCount,
    virtualCount,
    serviceCount,
    blogCount,
    blogPublishedCount,
    blogDraftCount,
    imageCount,
    videoCount,
    totalViews: totalViews._sum.views || 0,
    customerCount,
    revenue,
  }
}

export async function getSettings() {
  const settings = await prisma.siteSetting.findMany()
  const result = {}
  for (const s of settings) {
    result[s.key] = s.value
  }
  return {
    siteName: result.siteName || '',
    supportEmail: result.supportEmail || '',
    currency: result.currency || 'USD',
    maintenanceMode: result.maintenanceMode === 'true',
    shippingPolicy: result.shippingPolicy || '',
    returnPolicy: result.returnPolicy || '',
    socialLinks: result.socialLinks || '',
    shopBannerImage: result.shopBannerImage || '',
    shopWithUsHomepageImage: result.shopWithUsHomepageImage || '',
  }
}

export async function updateSettings(data) {
  const entries = Object.entries(data)

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value: typeof value === 'boolean' ? String(value) : String(value) },
        create: { key, value: typeof value === 'boolean' ? String(value) : String(value) },
      })
    )
  )

  return getSettings()
}
