import { prisma, withRetry } from '../config/database.js'
import { contactService } from './contactService.js'
import { circularTabService } from './circularTabService.js'

// Individual query timeout: if a single query takes longer than this,
// it will be rejected and the homepage will still load with the other data.
const QUERY_TIMEOUT_MS = 8000

function withTimeout(promise, timeoutMs = QUERY_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    ),
  ])
}

async function getHomepage() {
  try {
    const data = await withRetry(() =>
      Promise.all([
        withTimeout(prisma.portfolioProject.findMany({
          where: { published: true },
          orderBy: { displayOrder: 'asc' },
          take: 12,
          select: { id: true, title: true, imageUrl: true, featured: true, beforeImages: true, afterImages: true, homepageCircularImage: true, homepageCircularImageId: true },
        })),
        withTimeout(prisma.virtualDesign.findMany({
          where: { published: true },
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: { id: true, title: true, imageUrl: true, mediaUrls: true, featured: true, homepageCircularImage: true, homepageCircularImageId: true },
        })),
        withTimeout(prisma.service.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          take: 6,
          select: { id: true, title: true, imageUrl: true, homepageCircularImage: true, homepageCircularImageId: true },
        })),
        withTimeout(prisma.about.findFirst({
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            subtitle: true,
            description: true,
            story: true,
            mission: true,
            vision: true,
            experience: true,
            values: true,
            buttonText: true,
            buttonUrl: true,
            projectsCompleted: true,
            happyClients: true,
            yearsExperience: true,
            countriesServed: true,
            imageUrl: true,
            socialImage: true,
            homepageCircularImage: true,
            homepageCircularImageId: true,
          },
        })),
        withTimeout(prisma.aboutImage.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          select: { id: true, imageUrl: true, displayOrder: true, isActive: true },
        })),
        withTimeout(prisma.testimonial.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          take: 10,
          select: { id: true, clientName: true, content: true, project: true, photoUrl: true, initial: true, homepageCircularImage: true, homepageCircularImageId: true },
        })),
        withTimeout(prisma.workWithUs.findMany({
          where: { type: 'content', isActive: true },
          orderBy: { displayOrder: 'asc' },
          take: 6,
          select: { id: true, title: true, description: true, imageUrl: true, mediaUrls: true, homepageCircularImage: true, homepageCircularImageId: true, displayOrder: true, isActive: true },
        })),
        withTimeout(prisma.heroMedia.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          take: 5,
          select: { id: true, title: true, subtitle: true, imageUrl: true, mediaUrls: true },
        })),
        withTimeout(prisma.product.findMany({
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, name: true, price: true, originalPrice: true, mainImage: true, images: true },
        })),
        withTimeout(prisma.siteSetting.findUnique({ where: { key: 'shopWithUsHomepageImage' } })),
        withTimeout(prisma.blog.findMany({
          where: { published: true },
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: { id: true, title: true, image: true, video: true, description: true, category: true, homepageCircularImage: true, homepageCircularImageId: true },
        })),
        withTimeout(prisma.socialItem.findMany({
          orderBy: { displayOrder: 'asc' },
          select: { id: true, name: true, platform: true, imageUrl: true, link: true, isActive: true, homepageCircularImage: true },
        })),
        contactService.getContact(),
      ])
    )

      // Use Promise.allSettled so that if one query times out or fails,
      // the rest of the homepage still loads. Failed queries return their fallback.
      const results = await Promise.allSettled(data)
      const getResult = (index, fallback) => {
        if (results[index]?.status === 'fulfilled') return results[index].value
        return fallback
      }

      const portfolio = getResult(0, [])
      const virtualDesigns = getResult(1, [])
      const services = getResult(2, [])
      const about = getResult(3, null)
      const aboutImages = getResult(4, [])
      const testimonials = getResult(5, [])
      const workWithUs = getResult(6, [])
      const heroMedia = getResult(7, [])
      const featuredProducts = getResult(8, [])
      const shopWithUsImage = getResult(9, null)
      const blog = getResult(10, [])
      const socialItems = getResult(11, [])
      const contact = getResult(12, null)

      const featuredPortfolio = portfolio.filter((p) => p.featured).slice(0, 3)

      const mappedBlog = (blog || []).map((item) => ({
        ...item,
        imageUrl: item.image,
        mediaUrl: item.image,
        mediaUrls: item.video ? [item.video] : [],
        mediaType: item.video ? 'video' : 'image',
      }))

      const activeAboutImages = (aboutImages || []).filter((img) => img.isActive)

      const mappedWorkWithUs = (workWithUs || []).map((item) => ({
        ...item,
        imageUrl: item.imageUrl,
        mediaUrls: item.mediaUrls || [],
      }))

      // Fetch centralized circular tabs
      const circularTabs = await circularTabService.getHomepageCircularTabs()

       return {
        portfolio,
        virtualDesigns,
        virtualInteriorDesign: virtualDesigns,
        services,
        about: about ? { ...about, aboutImages: activeAboutImages } : null,
        aboutImages: activeAboutImages,
        testimonials,
        featuredPortfolio,
        featuredVirtualDesigns: virtualDesigns.filter((v) => v.featured).slice(0, 3),
        heroImages: heroMedia,
        heroMedia,
        featuredProject: featuredPortfolio[0] || portfolio[0] || null,
        products: featuredProducts,
        blog: mappedBlog,
        socialItems: (socialItems || []).filter((item) => item.isActive),
        contact,
        workWithUs: mappedWorkWithUs,
        shopWithUsHomepageImage: shopWithUsImage?.value || null,
        circularTabs,
      }
    } catch (err) {
      console.error('[homepageService] Failed to load homepage data:', err)
      return {
        portfolio: [],
        virtualDesigns: [],
        virtualInteriorDesign: [],
        services: [],
        about: null,
        aboutImages: [],
        testimonials: [],
        featuredPortfolio: [],
        featuredVirtualDesigns: [],
        heroImages: [],
        heroMedia: [],
        featuredProject: null,
        products: [],
        blog: [],
        socialItems: [],
        contact: null,
        workWithUs: [],
        shopWithUsHomepageImage: null,
      }
    }
}

export const homepageService = {
  getHomepage,
}
