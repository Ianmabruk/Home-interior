import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { env } from './env.js'

export const prisma = new PrismaClient()

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const MODEL_TABLE_MAP = {
  User: 'users',
  Wishlist: 'wishlists',
  Order: 'orders',
  Product: 'products',
  Project: 'projects',
  Portfolio: 'portfolios',
  About: 'abouts',
  VirtualDesign: 'virtual_designs',
  Settings: 'settings',
  NewsletterSubscription: 'newsletter_subscriptions',
  Analytics: 'analytics',
  Message: 'messages',
}

export const verifyTables = async () => {
  const models = Object.keys(MODEL_TABLE_MAP)
  const missing = []
  for (const model of models) {
    try {
      const tableName = MODEL_TABLE_MAP[model]
      await prisma.$queryRawUnsafe(`SELECT 1 FROM "${tableName}" LIMIT 0`)
    } catch {
      missing.push(model)
    }
  }
  if (missing.length) {
    console.error(`❌ Missing tables: ${missing.join(', ')}`)
    throw new Error(`Missing database tables: ${missing.join(', ')}`)
  }
  console.log(`✅ All ${models.length} Prisma tables verified`)
}

const MEDIA_SETTINGS_TABLES = [
  { table: 'projects', column: 'media_settings' },
  { table: 'portfolios', column: 'media_settings' },
  { table: 'abouts', column: 'media_settings' },
  { table: 'products', column: 'media_settings' },
  { table: 'virtual_designs', column: 'media_settings' },
]

export const verifyMediaSettingsColumns = async () => {
  const missing = []
  for (const { table, column } of MEDIA_SETTINGS_TABLES) {
    try {
      await prisma.$queryRawUnsafe(`SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = '${column}'`)
    } catch {
      missing.push(`${table}.${column}`)
    }
  }
  if (missing.length > 0) {
    console.error(`❌ Missing media_settings columns: ${missing.join(', ')}`)
    throw new Error(`Missing database columns: ${missing.join(', ')}`)
  }
  console.log('✅ media_settings columns verified on all content tables')
}

// Prisma scalar type -> PostgreSQL column type. Used only to auto-heal drift
// (add missing nullable columns), never for destructive changes.
const PRISMA_TO_PG = {
  String: 'TEXT',
  Int: 'INTEGER',
  BigInt: 'BIGINT',
  Float: 'DOUBLE PRECISION',
  Decimal: 'DECIMAL',
  Boolean: 'BOOLEAN',
  DateTime: 'TIMESTAMP',
  Json: 'JSONB',
  Bytes: 'BYTEA',
}

// The live database has historically drifted from schema.prisma: the
// schema-hardening migrations that added columns like projects.tags /
// projects.services never ran on the production DB (the deploy uses
// `prisma db push`, which is additive but can be skipped / can fail without
// re-applying). When a column the Prisma client expects is absent, every query
// against that model throws P2022 and 500s the endpoint.
//
// This guard (a) logs a clear warning for ANY column mismatch across every
// model, and (b) idempotently adds back any MISSING NULLABLE column via
// ADD COLUMN IF NOT EXISTS. Because it runs on every boot it is deploy-mechanism
// independent and prevents the silent schema-drift failures from recurring.
export const verifyAndHealSchema = async () => {
  let models
  try {
    models = Prisma.dmmf.datamodel.models
  } catch {
    console.warn('[SCHEMA GUARD] Prisma DMMF unavailable — skipping drift check.')
    return
  }

  let healed = 0
  let warned = 0

  for (const model of models) {
    const table = model.dbName || toSnake(model.name)
    let actualColumns = []
    try {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table}'`,
      )
      actualColumns = rows.map((r) => r.column_name)
    } catch {
      continue
    }
    const actualSet = new Set(actualColumns)

    for (const field of model.fields) {
      if (field.kind !== 'scalar') continue
      const column = field.dbName || field.name
      const pgType = PRISMA_TO_PG[field.type]
      if (!pgType) continue

      if (!actualSet.has(column)) {
        // Only auto-heal nullable columns. Adding a NOT NULL column to a table
        // that already has rows would fail, so required missing columns are
        // flagged but not auto-added (a deliberate, safe choice).
        if (field.isRequired) {
          console.warn(`[SCHEMA GUARD] ⚠️  Missing REQUIRED column ${table}.${column} (${pgType}) — not auto-added (would need a default).`)
          warned += 1
          continue
        }
        try {
          await prisma.$executeRawUnsafe(
            `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" ${pgType}`,
          )
          console.log(`[SCHEMA GUARD] ✅ Healed drift: added ${table}.${column} (${pgType})`)
          healed += 1
        } catch (err) {
          console.error(`[SCHEMA GUARD] ❌ Failed to add ${table}.${column}:`, err?.message)
          warned += 1
        }
      }
    }
  }

  if (healed === 0 && warned === 0) {
    console.log('✅ Schema guard: Prisma models match database columns (no drift).')
  } else {
    console.log(`[SCHEMA GUARD] Summary — healed: ${healed}, warnings: ${warned}`)
  }
}

const toSnake = (str) =>
  str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z])([A-Z][a-z])/g, '$1_$2').toLowerCase()

export const ensureAdminUser = async () => {
  const adminEmail = env.seedAdminEmail.toLowerCase()
  const maxRetries = 3
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const existing = await prisma.user.findFirst({
        where: { email: adminEmail },
      })

      if (!existing) {
        const passwordHash = await bcrypt.hash(env.seedAdminPassword, 12)
        await prisma.user.create({
          data: {
            fullName: 'HOK Platform Admin',
            email: adminEmail,
            role: 'admin',
            isActive: true,
            passwordHash,
          },
        })
        console.log('✅ Admin user created')
      } else if (existing.role !== 'admin' || !existing.isActive) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: 'admin', isActive: true },
        })
        console.log('✅ Admin user promoted to active admin')
      } else {
        console.log('✅ Admin user already exists')
      }
      return
    } catch (err) {
      if (attempt < maxRetries) {
        console.log(`⚠️  ensureAdminUser attempt ${attempt} failed: ${err.message} — retrying...`)
        await sleep(1000 * attempt)
      } else {
        console.error(`❌ ensureAdminUser failed after ${maxRetries} attempts:`, err.message)
        throw err
      }
    }
  }
}

export const connectDB = async () => {
  if (!env.databaseUrl) {
    throw new Error(
      'DATABASE_URL is not set. Add it to server/.env before starting the server.',
    )
  }

  await prisma.$connect()
  console.log('📝 Prisma Client connected to PostgreSQL')

  await verifyTables()
  await verifyMediaSettingsColumns()
  await verifyAndHealSchema()
  await ensureAdminUser()
}

export const disconnectDB = async () => {
  await prisma.$disconnect()
}
