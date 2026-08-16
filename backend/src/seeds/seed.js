import bcrypt from 'bcryptjs'
import { prisma } from '../config/database.js'
import { env } from '../config/env.js'

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
    const passwordHash = await bcrypt.hash(env.seedAdminPassword || 'admin123', 12)
    if (!existingAdmin) {
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
      await prisma.admin.update({
        where: { id: existingAdmin.id },
        data: {
          email: env.seedAdminEmail || 'info@hokinteriors.co.ke',
          passwordHash,
          role: 'ADMIN',
          fullName: 'Admin',
        },
      })
      console.log('Default admin updated')
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

  console.log('Seeding complete')
  await prisma.$disconnect()
  if (!critical) process.exit(1)
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
