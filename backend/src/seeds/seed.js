import bcrypt from 'bcryptjs'
import { prisma } from '../config/database.js'
import { env } from '../config/env.js'
import { CIRCULAR_TAB_DEFINITIONS } from '../constants/circularTabs.js'

async function seed() {
  let critical = true
  try {
    await prisma.$connect()
  } catch (err) {
    console.error('Seeding: database connection failed:', err?.message || err)
    process.exit(1)
  }

  const forceSeed = process.env.FORCE_SEED === 'true'
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction && !forceSeed) {
    console.log('Seeding: skipped in production (set FORCE_SEED=true to override)')
    console.log('Seeding complete')
    await prisma.$disconnect()
    return
  }

  try {
    const existingAdmin = await prisma.admin.findFirst()
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(env.seedAdminPassword || 'admin123', 12)
      await prisma.admin.create({
        data: {
          email: env.seedAdminEmail || 'info@hokinteriors.co.ke',
          passwordHash,
          fullName: 'Admin',
          role: 'ADMIN',
        },
      })
      console.log('Default admin created')
    } else {
      console.log('Default admin already exists — skipping admin seed to preserve existing credentials')
    }
  } catch (err) {
    console.error('Seeding: admin seed failed:', err?.message || err)
    critical = false
  }

  try {
    const settingsToSeed = [
      { key: 'siteName', value: 'HOK Interiors' },
      { key: 'supportEmail', value: 'info@hokinteriors.co.ke' },
      { key: 'currency', value: 'USD' },
      { key: 'maintenanceMode', value: 'false' },
      { key: 'shippingPolicy', value: '' },
      { key: 'returnPolicy', value: '' },
      { key: 'socialLinks', value: '' },
    ]

    for (const s of settingsToSeed) {
      const existing = await prisma.siteSetting.findUnique({ where: { key: s.key } })
      if (!existing) {
        await prisma.siteSetting.create({ data: s })
      }
    }
    console.log('Default settings created')
  } catch (err) {
    console.warn('Seeding: settings seed skipped:', err?.message || err)
  }

  try {
    const serviceCount = await prisma.service.count()
    if (serviceCount === 0) {
      await prisma.service.createMany({
        data: [
          { title: 'Interior Design', description: 'Full-service interior design tailored to your lifestyle.', icon: 'LayoutGrid', displayOrder: 0 },
          { title: 'Virtual Consultation', description: 'Online design consultations from anywhere in the world.', icon: 'MonitorSmartphone', displayOrder: 1 },
          { title: 'Furniture Curation', description: 'Handpicked furniture and decor for timeless elegance.', icon: 'Armchair', displayOrder: 2 },
        ],
      })
      console.log('Default services created')
    }
  } catch (err) {
    console.warn('Seeding: services seed skipped:', err?.message || err)
  }

  try {
    const testimonialCount = await prisma.testimonial.count()
    if (testimonialCount === 0) {
      await prisma.testimonial.createMany({
        data: [
          { clientName: 'Sarah Mitchell', content: 'HOK transformed our home into a sanctuary. Absolutely stunning work!', displayOrder: 0 },
          { clientName: 'James Chen', content: 'Professional, creative, and detail-oriented. Highly recommend their virtual design service.', displayOrder: 1 },
          { clientName: 'Elena Rodriguez', content: 'The team understood our vision perfectly and brought it to life beyond expectations.', displayOrder: 2 },
        ],
      })
      console.log('Default testimonials created')
    }
  } catch (err) {
    console.warn('Seeding: testimonials seed skipped:', err?.message || err)
  }

  try {
    const heroCount = await prisma.heroMedia.count()
    if (heroCount === 0) {
      await prisma.heroMedia.create({
        data: {
          title: 'Luxury Interior Design',
          subtitle: 'Crafting spaces that inspire',
          isActive: true,
          displayOrder: 0,
        },
      })
      console.log('Default hero media created')
    }
  } catch (err) {
    console.warn('Seeding: hero media seed skipped:', err?.message || err)
  }

  try {
    for (const tab of CIRCULAR_TAB_DEFINITIONS) {
      const existing = await prisma.circularTab.findUnique({ where: { key: tab.key } })
      if (!existing) {
        await prisma.circularTab.create({ data: tab })
      }
    }
    console.log('Default circular tabs created')
  } catch (err) {
    console.warn('Seeding: circular tabs seed skipped:', err?.message || err)
  }

  try {
    const packageCount = await prisma.virtualDesign.count()
    if (packageCount === 0) {
      await prisma.virtualDesign.createMany({
        data: [
          {
            title: 'Mini Refresh',
            description: 'A renter-friendly glow up in 7 days. Perfect for quick transformations.',
            tagline: 'Renter-friendly glow up in 7 days',
            category: 'E-Design',
            price: 12000,
            priceMax: 18000,
            currency: 'KES',
            features: [
              'Moodboard and renter-safe color palette',
              '2D furniture layout',
              'Budget shopping list',
              'Renter-friendly decor tips',
              'One revision',
              'Delivery in 7 days',
            ],
            ctaText: 'Book Mini Refresh',
            packageType: 'mini-refresh',
            displayOrder: 0,
            published: true,
            featured: false,
            mediaType: 'image',
          },
          {
            title: 'Signature Rental Design',
            description: 'See your dream rental before you buy anything. Two design concepts with photorealistic 3D render.',
            tagline: 'See your dream rental before you buy anything',
            category: 'E-Design',
            price: 28000,
            priceMax: 35000,
            currency: 'KES',
            features: [
              'Everything in Mini Refresh',
              'Two design concepts',
              'Photorealistic 3D render',
              'Budget and Elevated shopping lists',
              'Renter-friendly styling recommendations',
              'Two revisions',
              'Delivery in 14 days',
            ],
            ctaText: 'Book Signature Design',
            packageType: 'signature',
            displayOrder: 1,
            published: true,
            featured: true,
            mediaType: 'image',
          },
          {
            title: 'Whole Home Bundles',
            description: 'Cohesive design for your whole apartment. Up to 3 rooms with comprehensive styling.',
            tagline: 'Cohesive design for your whole apartment',
            category: 'E-Design',
            price: 55000,
            priceMax: 70000,
            currency: 'KES',
            features: [
              'Signature Design for up to 3 rooms',
              'Cohesive interior styling',
              'Multifunctional furniture recommendations',
              'Lighting and rug sizing guide',
              'Move-in and move-out styling tips',
              'Three revisions',
              'Delivery in 21 days',
            ],
            ctaText: 'Book Whole Home',
            packageType: 'whole-home',
            displayOrder: 2,
            published: true,
            featured: false,
            mediaType: 'image',
          },
        ],
      })
      console.log('Default e-design packages created')
    }
  } catch (err) {
    console.warn('Seeding: e-design packages seed skipped:', err?.message || err)
  }

  console.log('Seeding complete')
  await prisma.$disconnect()
  if (!critical) process.exit(1)
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
