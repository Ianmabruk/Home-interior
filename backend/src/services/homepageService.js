import { prisma, withRetry } from '../config/database.js'
import { contactService } from './contactService.js'

export const homepageService = {
  getHomepage,
}

async function getHomepage() {
  try {
    const data = await withRetry(() =>
      Promise.all([
        prisma.portfolioProject.findMany({
          where: { published: true },
          orderBy: { displayOrder: 'asc' },
          take: 6,
          select: { id: true, title: true, imageUrl: true, mediaUrls: true, featured: true },
        }),
        prisma.virtualDesign.findMany({
          where: { published: true },
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: { id: true, title: true, imageUrl: true, mediaUrls: true, featured: true },
        }),
        prisma.service.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          take: 6,
          select: { id: true, title: true, imageUrl: true },
        }),
        prisma.about.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { id: true, imageUrl: true, socialImage: true },
        }),
        prisma.testimonial.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          take: 10,
          select: { id: true, clientName: true, content: true, photoUrl: true },
        }),
        prisma.heroMedia.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          take: 5,
          select: { id: true, title: true, subtitle: true, imageUrl: true, mediaUrls: true },
        }),
        prisma.product.findMany({
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, name: true, price: true, originalPrice: true, mainImage: true, images: true },
        }),
        prisma.blog.findMany({
          where: { published: true },
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: { id: true, title: true, image: true, video: true, description: true, category: true },
        }),
        contactService.getContact(),
      ])
    )

    const [
      portfolio,
      virtualDesigns,
      services,
      about,
      testimonials,
      heroMedia,
      featuredProducts,
      blog,
      contact,
    ] = data

    const featuredPortfolio = portfolio.filter((p) => p.featured).slice(0, 3)

    const mappedBlog = (blog || []).map((item) => ({
      ...item,
      imageUrl: item.image,
      mediaUrl: item.image,
      mediaUrls: item.video ? [item.video] : [],
      mediaType: item.video ? 'video' : 'image',
    }))

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
      blog: mappedBlog,
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
      blog: [],
      contact: {
        phoneNumbers: ['+254 700 000 000', '+254 711 111 111'],
        emails: ['info@hokinteriors.com', 'projects@hokinteriors.com'],
        addresses: ['Westlands, Nairobi, Kenya'],
        businessHours: 'Mon - Fri: 8:00 AM - 6:00 PM\nSat: 9:00 AM - 4:00 PM\nSun: Closed',
      },
      blog: [],
    }
  }
}
