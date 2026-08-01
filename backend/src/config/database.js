import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const RETRYABLE_CODES = new Set(['P2024', 'P1001', 'P1008', 'P1009'])

export async function withRetry(fn, retries = 3, delayMs = 250) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const code = err?.code
      const message = String(err?.message || '')
      const isRetryable = RETRYABLE_CODES.has(code) || /kind:\s*Closed/i.test(message) || /P1002/i.test(message)
      if (!isRetryable || attempt === retries) throw err
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)))
    }
  }
}

let connectPromise = null

export async function connectDatabase() {
  if (connectPromise) return connectPromise
  connectPromise = prisma.$connect().catch((err) => {
    console.error('[database] initial connect failed:', err?.message || err)
    connectPromise = null
    throw err
  })
  return connectPromise
}

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
})

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err)
})
