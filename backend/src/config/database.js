import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const RETRYABLE_CODES = new Set(['P2024', 'P1001', 'P1008', 'P1009'])

export async function withRetry(fn, retries = 2, delayMs = 200) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const code = err?.code
      const isRetryable = RETRYABLE_CODES.has(code) || /kind:\s*Closed/i.test(String(err?.message || ''))
      if (!isRetryable || attempt === retries) throw err
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)))
    }
  }
}
