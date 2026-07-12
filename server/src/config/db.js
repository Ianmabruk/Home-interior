import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { env } from './env.js'
import { execSync } from 'child_process'

export const prisma = new PrismaClient()

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Regenerate the Prisma client from the schema on disk. This is the primary
// guard against stale-client errors such as
// "PrismaClientValidationError: Unknown argument: mediaSettings", which happen
// when the running container was built from an older schema but the database
// schema was later migrated forward (e.g. media_positioning / schema_hardening
// migrations added media_settings to portfolios). Running this BEFORE node
// imports @prisma/client guarantees the in-memory client matches schema.prisma.
export const generatePrismaClient = async () => {
  try {
    console.log('🛠  Regenerating Prisma client to match schema (prisma generate)...')
    execSync('npx prisma generate', {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: { ...process.env },
    })
    console.log('✅ Prisma client generated')
  } catch (err) {
    // Best-effort: the build/start step should have generated the client. If
    // this still fails we continue with the previously generated client rather
    // than crashing the whole server boot.
    console.warn('⚠️  prisma generate failed (continuing with existing client):', err.message)
    console.warn('   Run `npx prisma generate` to rebuild the client from schema.prisma')
  }
}

// Run a prisma CLI command, capturing combined output so we can inspect it
// (execSync with stdio:'inherit' discards the buffer from the thrown error).
const runPrismaCli = (cmd) => {
  try {
    const out = execSync(cmd, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    }).toString()
    process.stdout.write(out)
    return { ok: true, output: out }
  } catch (err) {
    const output = (err.stdout?.toString() || '') + (err.stderr?.toString() || '') + (err.message || '')
    // Echo what prisma reported so it is visible in the boot logs.
    process.stderr.write(output)
    return { ok: false, output }
  }
}

// Recursively apply pending migrations. If a migration was already applied
// out-of-band (its schema changes exist in the DB but the _prisma_migrations
// journal does not record it), `migrate deploy` fails with P3018 / "already
// exists". In that case we record the migration as applied via
// `migrate resolve --applied` and retry, so a drifted journal can never
// block server startup. Any other failure is rethrown.
const deployWithRecovery = (pending) => {
  let attempts = 0
  const maxAttempts = pending.length + 1
  while (attempts < maxAttempts) {
    attempts += 1
    const res = runPrismaCli('npx prisma migrate deploy')
    if (res.ok) return
    if (/P3018|already exists/i.test(res.output)) {
      const match = res.output.match(/Migration name:\s*(\S+)/)
      const name = match?.[1]
      if (name) {
        console.warn(`⚠️  Migration "${name}" was applied out-of-band (changes already present). Recording it as applied...`)
        runPrismaCli(`npx prisma migrate resolve --applied ${name}`)
        continue
      }
    }
    throw new Error(`prisma migrate deploy failed: ${res.output}`)
  }
}

export const runMigrations = async () => {
  await generatePrismaClient()

  // Reads the applied-migrations journal. On a brand-new database the
  // _prisma_migrations table does not exist yet, so we treat that as
  // "all migrations pending" instead of crashing.
  let appliedNames = new Set()
  try {
    const applied = await prisma.$queryRaw`
      SELECT "migration_name" FROM "_prisma_migrations" ORDER BY "migration_name"
    `
    appliedNames = new Set((applied || []).map((m) => m.migration_name))
  } catch {
    console.warn('⚠️  Could not read "_prisma_migrations" (table may not exist yet). Treating all migrations as pending.')
  }

  const fs = await import('fs')
  const path = await import('path')
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations')
  const entries = await fs.promises.readdir(migrationsDir, { withFileTypes: true })
  const migrationFolders = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()

  const pending = migrationFolders.filter((name) => !appliedNames.has(name))

  if (pending.length === 0) {
    console.log('✅ Prisma migrations already applied')
  } else {
    console.warn(`⚠️  ${pending.length} pending migration(s): ${pending.join(', ')}`)
    try {
      deployWithRecovery(pending)
      console.log('✅ Prisma migrations deployed successfully')
    } catch (err) {
      console.error('❌ Prisma migrate deploy failed:', err.message)
      console.error('   Ensure your start command includes: cd server && npx prisma generate && npx prisma migrate deploy')
      throw err
    }
  }

  // Verify that the expected columns exist after migration. This catches
  // partial migrations or schema drift that would otherwise cause
  // PrismaClientValidationError at runtime.
  await verifyMediaSettingsColumns()
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
    console.error('   Run: npx prisma migrate deploy')
    throw new Error(`Missing database columns: ${missing.join(', ')}`)
  }
  console.log('✅ media_settings columns verified on all content tables')
}

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

  await runMigrations()
  await verifyTables()
  await ensureAdminUser()
}

export const disconnectDB = async () => {
  await prisma.$disconnect()
}
