import { PrismaClient } from '@prisma/client'
import { env } from './env.js'

const globalForPrisma = globalThis

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: (() => {
          let url = env.databaseUrl
          if (!url.includes('prepared_statements=false')) {
            url += (url.includes('?') ? '&' : '?') + 'prepared_statements=false'
          }
          if (!url.includes('statement_cache_size=0')) {
            url += (url.includes('?') ? '&' : '?') + 'statement_cache_size=0'
          }
          return url
        })(),
      },
    },
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const isP1001 = (err) => err?.code === 'P1001' || (err?.message?.includes('P1001') && err?.message?.includes("Can't reach database server"))

export const connectDB = async () => {
  console.log('Connecting to PostgreSQL...')
  const maxStartupRetries = 5
  for (let attempt = 1; attempt <= maxStartupRetries; attempt++) {
    try {
      await prisma.$connect()
      console.log('Prisma Client connected to PostgreSQL')
      return
    } catch (err) {
      if (isP1001(err) && attempt < maxStartupRetries) {
        console.warn(`Connection attempt ${attempt}/${maxStartupRetries} failed (P1001), retrying in ${attempt * 2}s...`)
        await sleep(attempt * 2000)
      } else {
        throw err
      }
    }
  }
}

export const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { database: 'connected', prisma: 'connected' }
  } catch (err) {
    console.error('[HEALTH CHECK] Database health check failed:', err?.message)
    return { database: 'disconnected', prisma: 'disconnected', error: err?.message }
  }
}

export default prisma
