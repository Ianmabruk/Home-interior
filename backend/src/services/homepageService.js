import { prisma } from '../config/database.js'

export const homepageService = {
  getHomepage,
}

async function getHomepage() {
  try {
    const [
      portfolio,
      virtualDesigns,
      services,
      about,
      testimonials,
      heroMedia,
      featuredProducts,
    ] = await Promise.all([
      prisma.portfolioProject.findMany({
        where: { published: true },
        orderBy: { displayOrder: 'asc' },
        take: 6,
      }),
      prisma.virtualDesign.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        take: 6,
      }),
      prisma.about.findFirst({ orderBy: { createdAt: 'desc' } }),
      prisma.testimonial.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        take: 10,
      }),
      prisma.heroMedia.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        take: 5,
      }),
      prisma.product.findMany({
        where: { featured: true },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ])

    const featuredPortfolio = portfolio.filter((p) => p.featured).slice(0, 3)

    return {
      portfolio,
      virtualDesigns,
      virtualInteriorDesign: virtualDesigns,
      services,
      about,
      testimonials,
      featuredPortfolio,
      featuredVirtualDesigns: virtualDesigns.filter((v) => v.featured).slice(0, 3),
      heroImages: heroMedia,
      heroMedia,
      featuredProject: featuredPortfolio[0] || portfolio[0] || null,
      products: featuredProducts,
    }
  } catch (err) {
    console.error('[homepageService] Failed to load homepage data:', err)
    return {
      portfolio: [],
      virtualDesigns: [],
      virtualInteriorDesign: [],
      services: [],
      about: null,
      testimonials: [],
      featuredPortfolio: [],
      featuredVirtualDesigns: [],
      heroImages: [],
      heroMedia: [],
      featuredProject: null,
      products: [],
    }
  }
}
