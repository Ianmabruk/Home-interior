import { prisma } from '../src/config/database.js'

beforeEach(async () => {
  await prisma.$connect()
})

afterEach(async () => {
  await cleanupTestData()
})

afterAll(async () => {
  await prisma.$disconnect()
})

async function cleanupTestData() {
  const testPrefix = 'test_'
  const testAdmins = await prisma.admin.findMany({
    where: { email: { startsWith: testPrefix } },
    select: { id: true },
  })
  const adminIds = testAdmins.map(a => a.id)
  if (adminIds.length > 0) {
    await prisma.passwordReset.deleteMany({
      where: { adminId: { in: adminIds } },
    })
  }
  await prisma.admin.deleteMany({
    where: { email: { startsWith: testPrefix } },
  })
  await prisma.portfolioProject.deleteMany({
    where: { title: { startsWith: testPrefix } },
  })
  await prisma.virtualDesign.deleteMany({
    where: { title: { startsWith: testPrefix } },
  })
  await prisma.service.deleteMany({
    where: { title: { startsWith: testPrefix } },
  })
  await prisma.product.deleteMany({
    where: { name: { startsWith: testPrefix } },
  })
  await prisma.blog.deleteMany({
    where: { title: { startsWith: testPrefix } },
  })
  const testAbouts = await prisma.about.findMany({
    where: { title: { startsWith: testPrefix } },
    select: { id: true },
  })
  const aboutIds = testAbouts.map(a => a.id)
  if (aboutIds.length > 0) {
    await prisma.aboutImage.deleteMany({
      where: { aboutId: { in: aboutIds } },
    })
  }
  await prisma.about.deleteMany({
    where: { id: { in: aboutIds } },
  })
  await prisma.heroMedia.deleteMany({
    where: { title: { startsWith: testPrefix } },
  })
  await prisma.testimonial.deleteMany({
    where: { clientName: { startsWith: testPrefix } },
  })
  await prisma.socialItem.deleteMany({
    where: { name: { startsWith: testPrefix } },
  })
  await prisma.consultation.deleteMany({
    where: { name: { startsWith: testPrefix } },
  })
  await prisma.order.deleteMany({
    where: { email: { startsWith: testPrefix } },
  })
  await prisma.cartItem.deleteMany({
    where: { userId: { startsWith: testPrefix } },
  })
  await prisma.wishlistItem.deleteMany({
    where: { userId: { startsWith: testPrefix } },
  })
  await prisma.message.deleteMany({
    where: { name: { startsWith: testPrefix } },
  })
}

export { cleanupTestData }
