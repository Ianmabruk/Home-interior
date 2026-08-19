import { prisma } from '../src/config/database.js'

export default async () => {
  console.log('[globalSetup] Connecting to database for tests...')
  await prisma.$connect()
  console.log('[globalSetup] Database connected')
}
