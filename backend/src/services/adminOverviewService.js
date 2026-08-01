import { prisma } from '../config/database.js'

export const adminOverviewService = {
  getAdminOverview,
  getSettings,
  updateSettings,
}

export async function getAdminOverview() {
  const [portfolioCount, productCount, orderCount, consultationCount, heroCount, virtualCount, serviceCount] = await Promise.all([
    prisma.portfolioProject.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.consultation.count(),
    prisma.heroMedia.count(),
    prisma.virtualDesign.count(),
    prisma.service.count(),
  ])

  return {
    portfolioCount,
    productCount,
    orderCount,
    consultationCount,
    heroCount,
    virtualCount,
    serviceCount,
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
