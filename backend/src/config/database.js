import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

function createPrismaClient() {
  const url = new URL(process.env.DATABASE_URL || '')
  if (!url.searchParams.has('connection_limit')) {
    const limit = process.env.NODE_ENV === 'production' ? 5 : 2
    url.searchParams.set('connection_limit', String(limit))
  }
  url.searchParams.set('connect_timeout', '10')
  const finalUrl = url.toString()

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: finalUrl,
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
  connectPromise = withRetry(
    () => prisma.$connect(),
    5,
    1000,
  ).catch((err) => {
    console.error('[database] initial connect failed after retries:', err?.message || err)
    connectPromise = null
    throw err
  })
  return connectPromise
}

process.on('unhandledRejection', (reason) => {
  console.error('[database] [unhandledRejection]', reason)
})

process.on('uncaughtException', (err) => {
  console.error('[database] [uncaughtException]', err)
})
