import { prisma, withRetry } from '../config/database.js'
import { contactService } from './contactService.js'

async function getHomepage() {
  try {
    const data = await withRetry(() =>
      Promise.all([
          prisma.portfolioProject.findMany({
          where: { published: true },
          orderBy: { displayOrder: 'asc' },
          take: 12,
          select: { id: true, title: true, imageUrl: true, featured: true, beforeImages: true, afterImages: true },
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
          select: { id: true, title: true, imageUrl: true, homepageCircularImage: true, homepageCircularImageId: true },
        }),
        prisma.about.findFirst({
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
        }),
        prisma.aboutImage.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          select: { id: true, imageUrl: true, displayOrder: true, isActive: true },
        }),
        prisma.testimonial.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          take: 10,
          select: { id: true, clientName: true, content: true, project: true, photoUrl: true, initial: true, homepageCircularImage: true, homepageCircularImageId: true },
        }),
        prisma.workWithUs.findMany({
          where: { type: 'content', isActive: true },
          orderBy: { displayOrder: 'asc' },
          take: 6,
          select: { id: true, title: true, description: true, imageUrl: true, mediaUrls: true, homepageCircularImage: true, homepageCircularImageId: true, displayOrder: true, isActive: true },
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
         prisma.siteSetting.findUnique({ where: { key: 'shopWithUsHomepageImage' } }),
        prisma.blog.findMany({
          where: { published: true },
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: { id: true, title: true, image: true, video: true, description: true, category: true, homepageCircularImage: true, homepageCircularImageId: true },
        }),
        prisma.socialItem.findMany({
          orderBy: { displayOrder: 'asc' },
          select: { id: true, name: true, platform: true, imageUrl: true, link: true, isActive: true, homepageCircularImage: true },
        }),
        contactService.getContact(),
      ])
    )

     const [
       portfolio,
       virtualDesigns,
       services,
       about,
       aboutImages,
       testimonials,
       workWithUs,
       heroMedia,
       featuredProducts,
       blog,
       socialItems,
       contact,
       shopWithUsImage,
     ] = data

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
