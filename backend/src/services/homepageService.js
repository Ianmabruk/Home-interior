import { prisma } from '../config/database.js'
import { contactService } from './contactService.js'

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
      contact,
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
        include: { variants: true },
      }),
      contactService.getContact(),
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
      contact,
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
      contact: {
        phoneNumbers: ['+254 700 000 000', '+254 711 111 111'],
        emails: ['info@hokinteriors.com', 'projects@hokinteriors.com'],
        addresses: ['Westlands, Nairobi, Kenya'],
        businessHours: 'Mon - Fri: 8:00 AM - 6:00 PM\nSat: 9:00 AM - 4:00 PM\nSun: Closed',
      },
    }
  }
}
