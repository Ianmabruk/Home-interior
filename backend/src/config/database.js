import { PrismaClient } from '@prisma/client'
import { env } from './env.js'

const globalForPrisma = globalThis

function buildDatabaseUrl() {
  const databaseUrl = env.databaseUrl
  if (!databaseUrl) {
    const err = new Error('DATABASE_URL is not configured. Set DATABASE_URL in your environment before starting the server.')
    console.error('[database] FATAL: DATABASE_URL is missing — cannot initialize Prisma client.')
    throw err
  }
  const url = new URL(databaseUrl)
  const isNeon = url.hostname.includes('neon.tech')
  const usingPooler = url.hostname.includes('-pooler')

  // Strip params we manage so we never stack duplicate values across restarts.
  for (const key of ['connection_limit', 'pgbouncer', 'connect_timeout', 'pool_timeout', 'idle_in_transaction_session_timeout', 'tcp_user_timeout', 'statement_timeout']) {
    url.searchParams.delete(key)
  }

  if (usingPooler) {
    // When using Neon's serverless pooler (PgBouncer in transaction-pooling mode),
    // pgbouncer=true tells Prisma to use transaction pooling.
    // connection_limit controls how many concurrent connections Prisma opens to the pooler.
    // Neon's pooler multiplexes connections, so we can use a higher limit without
    // exhausting database resources. Using limit=1 causes severe pool starvation
    // when multiple queries run concurrently (e.g., homepage's 13 parallel queries).
    url.searchParams.set('pgbouncer', 'true')
    url.searchParams.set('connection_limit', process.env.NODE_ENV === 'production' ? '10' : '5')
    url.searchParams.set('pool_timeout', '10')
  } else if (isNeon) {
    url.searchParams.set('connection_limit', process.env.NODE_ENV === 'production' ? '10' : '10')
  } else {
    url.searchParams.set('connection_limit', process.env.NODE_ENV === 'production' ? '10' : '10')
  }

  // connect_timeout: max seconds to wait for a connection to establish
  url.searchParams.set('connect_timeout', '5')
  // pool_timeout: max seconds to wait for a connection from the pool.
  // Set to 10s to allow queuing during burst traffic without premature timeout
  url.searchParams.set('pool_timeout', '10')
  // idle_in_transaction_session_timeout: kill idle transactions after 30s
  url.searchParams.set('idle_in_transaction_session_timeout', '30000')
  // statement_timeout: kill queries running longer than 10s at the database level.
  // This prevents a single slow query from hogging a connection indefinitely.
  url.searchParams.set('statement_timeout', '10000')
  // keepalives keep direct (non-pooled) TCP connections alive; ignored by the pooler.
  url.searchParams.set('keepalives', '1')
  url.searchParams.set('keepalives_idle', '30')
  url.searchParams.set('keepalives_interval', '10')
  url.searchParams.set('keepalives_count', '5')
  return url.toString()
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: buildDatabaseUrl(),
      },
    },
  })
}

const RETRYABLE_CODES = new Set(['P2024', 'P1001', 'P1008', 'P1009'])

export async function withRetry(fn, retries = 3, delayMs = 100, maxTotalMs = 5000) {
  const startTime = Date.now()
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const code = err?.code
      const message = String(err?.message || '')
      const isRetryable = RETRYABLE_CODES.has(code) || /kind:\s*Closed/i.test(message) || /P1002/i.test(message) || /timed out/i.test(message)
      if (!isRetryable || attempt === retries) throw err
      const elapsed = Date.now() - startTime
      if (elapsed >= maxTotalMs) throw err
      const delay = Math.min(delayMs * (attempt + 1), maxTotalMs - elapsed)
      if (delay > 0) await new Promise((r) => setTimeout(r, delay))
      if (Date.now() - startTime >= maxTotalMs) throw err
    }
  }
}

function createRetryingPrisma(rawPrisma) {
  const retryableQueryMethods = new Set([
    'findMany', 'findFirst', 'findUnique', 'create', 'createMany',
    'update', 'updateMany', 'delete', 'deleteMany', 'count',
    'groupBy', '$queryRaw', '$queryRawUnsafe', '$executeRaw', '$executeRawUnsafe',
    '$transaction',
  ])

  function retryable(fn) {
    if (typeof fn !== 'function') return fn
    return (...args) => withRetry(() => fn(...args))
  }

  return new Proxy(rawPrisma, {
    get(target, prop) {
      const value = target[prop]
      if (typeof value === 'function' && retryableQueryMethods.has(prop)) {
        return retryable(value.bind(target))
      }
      if (value && typeof value === 'object' && !(value instanceof Promise) && !(value instanceof Error)) {
        return createRetryingPrisma(value)
      }
      return value
    },
  })
}

let prismaInstance = null

function getPrismaInstance() {
  if (prismaInstance) return prismaInstance
  if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma
  } else {
    prismaInstance = createRetryingPrisma(createPrismaClient())
  }
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance
  }
  return prismaInstance
}

export const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      return getPrismaInstance()[prop]
    },
  }
)

let connectPromise = null

const KEEPALIVE_INTERVAL = 30 * 1000

function startKeepalive() {
  if (globalForPrisma.__keepaliveStarted) return
  globalForPrisma.__keepaliveStarted = true
  setInterval(async () => {
    try {
      const instance = getPrismaInstance()
      await instance.$queryRaw`SELECT 1`
    } catch (err) {
      console.error('[database] keepalive ping failed:', err?.message || err)
    }
  }, KEEPALIVE_INTERVAL)
}

export async function connectDatabase() {
  if (connectPromise) return connectPromise
  const instance = getPrismaInstance()
  connectPromise = withRetry(
    () => instance.$connect(),
    5,
    1000,
  ).catch((err) => {
    console.error('[database] initial connect failed after retries:', err?.message || err)
    connectPromise = null
    throw err
  })
  await connectPromise
  startKeepalive()
  return connectPromise
}

process.on('unhandledRejection', (reason) => {
  console.error('[database] [unhandledRejection]', reason)
})

process.on('uncaughtException', (err) => {
  console.error('[database] [uncaughtException]', err)
})
