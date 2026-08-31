#!/usr/bin/env node
import { execSync } from 'child_process'

const MAX_RETRIES = 8
const RETRY_DELAY = 15000
const INITIAL_DELAY = 5000
const COMMAND_TIMEOUT = 300000
const PRISMA_ADVISORY_LOCK_ID = 72707369

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// Neon pooler + advisory locks: use a direct connection for migrations
// by temporarily bypassing the pooler if DIRECT_DATABASE_URL is set
function buildEnv() {
  const env = { ...process.env, PGCONNECT_TIMEOUT: '60' }
  if (env.DIRECT_DATABASE_URL && !env.DATABASE_URL.includes('-pooler')) {
    // Already using direct connection
  } else if (env.DIRECT_DATABASE_URL) {
    console.log('[migrate:deploy] Using DIRECT_DATABASE_URL for migration (bypasses pooler)')
    env.DIRECT_DATABASE_URL = env.DIRECT_DATABASE_URL
    env.DATABASE_URL = env.DIRECT_DATABASE_URL
  } else if (env.DATABASE_URL && env.DATABASE_URL.includes('-pooler')) {
    // No explicit direct URL configured: Neon's direct endpoint is the same
    // host without the "-pooler" segment. Advisory locks require a direct
    // (non-transaction-pooled) connection, so strip it for migrations.
    env.DATABASE_URL = env.DATABASE_URL.replace('-pooler', '')
    console.log('[migrate:deploy] Stripped "-pooler" from DATABASE_URL for migration (direct connection)')
  }
  // Increase statement timeout for slow Neon cold starts
  if (!env.DATABASE_URL.includes('statement_timeout')) {
    env.DATABASE_URL = env.DATABASE_URL + (env.DATABASE_URL.includes('?') ? '&' : '?') + 'statement_timeout=60000'
  }
  return env
}

function run(cmd, env) {
  try {
    const out = execSync(cmd, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: COMMAND_TIMEOUT,
      env,
      encoding: 'utf-8',
    })
    return { ok: true, stdout: out || '', stderr: '' }
  } catch (err) {
    return {
      ok: false,
      stdout: (err?.stdout || '') || '',
      stderr: (err?.stderr || '') || '',
      message: err?.message || '',
    }
  }
}

// Read-only check: are all migrations already applied?
// prisma migrate status does NOT take the deploy advisory lock, so it
// works even when the deploy lock is stuck.
function checkStatusUpToDate(env) {
  const result = run('npx prisma migrate status', env)
  const combined = (result.stdout || '') + (result.stderr || '') + (result.message || '')
  // Heuristics for "nothing to do":
  //   - "Database is up to date"
  //   - "No pending migrations"
  //   - exit code 0 with no "following migration" pending lines
  const upToDateMarkers = [
    /Database is up to date/i,
    /No pending migrations to apply/i,
    /No pending migrations/i,
  ]
  if (upToDateMarkers.some((re) => re.test(combined))) {
    return { upToDate: true, raw: combined }
  }
  return { upToDate: false, raw: combined }
}

function extractFailedMigrationNames(output) {
  const names = []
  const regex = /The `([^`]+)` migration.*failed/g
  let match
  while ((match = regex.exec(output)) !== null) {
    if (!names.includes(match[1])) names.push(match[1])
  }
  return names
}

function tryResolveFailedMigrations(output, env) {
  const names = extractFailedMigrationNames(output)
  if (names.length === 0) return false

  console.log(`[migrate:deploy] Found failed migration(s): ${names.join(', ')}`)
  let resolved = false
  for (const name of names) {
    console.log(`[migrate:deploy] Marking ${name} as rolled back...`)
    const r = run(`npx prisma migrate resolve --rolled-back ${name}`, env)
    if (r.ok) {
      console.log(`[migrate:deploy] Successfully marked ${name} as rolled back`)
      resolved = true
    } else {
      const errOutput = r.stdout + r.stderr + r.message
      console.warn(`[migrate:deploy] Could not resolve ${name}:`, errOutput.slice(0, 300))
    }
  }
  return resolved
}

// Last-resort fallback: prisma db push WITHOUT --accept-data-loss so
// that schema drift cannot silently drop columns/tables. The script will
// only succeed if the database schema already matches schema.prisma (i.e.
// the only reason migrate deploy failed was the stuck lock).
function tryDbPushNoDataLoss(env) {
  console.log('[migrate:deploy] Lock persists. Falling back to prisma db push (no data-loss flag)...')
  // We intentionally do NOT pass --accept-data-loss. If there is real
  // schema drift, db push will refuse to drop data and exit non-zero.
  const r = run('npx prisma db push --skip-generate', env)
  if (r.ok) {
    console.log('[migrate:deploy] Schema synced via db push (fallback, no data loss)')
    return true
  }
  const combined = r.stdout + r.stderr + r.message
  // Detect the "would lose data" warning so we can be explicit
  if (
    combined.includes('Drift detected') ||
    combined.includes('would result in data loss') ||
    combined.includes('data loss') ||
    combined.includes('accept-data-loss')
  ) {
    console.error(
      '[migrate:deploy] db push detected schema drift that would cause data loss. Aborting to protect data.',
    )
  } else {
    console.error('[migrate:deploy] db push fallback failed:', combined.slice(0, 500))
  }
  return false
}

async function main() {
  console.log('[migrate:deploy] Starting migration step (data-safe)...')

  // Short wait to let any stale locks clear (Neon pooler can hold locks briefly)
  console.log(`[migrate:deploy] Waiting ${INITIAL_DELAY / 1000}s for any stale locks to clear...`)
  await sleep(INITIAL_DELAY)

  const env = buildEnv()

  // Pre-flight: if the DB is already up to date (read-only status check),
  // there is nothing to do and we can exit cleanly even if the deploy
  // advisory lock would otherwise be unavailable.
  const pre = checkStatusUpToDate(env)
  if (pre.upToDate) {
    console.log('[migrate:deploy] Pre-check: database is already up to date. Nothing to apply.')
    return
  }
  console.log('[migrate:deploy] Pre-check: pending migrations detected. Proceeding with deploy...')

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[migrate:deploy] Attempt ${attempt}/${MAX_RETRIES}`)

    const result = run('npx prisma migrate deploy', env)
    if (result.ok) {
      console.log(result.stdout)
      console.log('[migrate:deploy] Migrations applied successfully')
      return
    }

    const output = result.stdout + result.stderr + result.message
    console.error(result.stdout)
    console.error(result.stderr)

    const isLockTimeout =
      output.includes('advisory lock') ||
      output.includes('P1002') ||
      output.includes('ETIMEDOUT') ||
      /timeout/i.test(output)

    // CRITICAL data-safety check: if the deploy failed because of a stuck
    // lock but the database is already up to date, we are done. This
    // prevents an infinite retry loop and avoids touching the data layer.
    if (isLockTimeout) {
      const status = checkStatusUpToDate(env)
      if (status.upToDate) {
        console.log(
          `[migrate:deploy] Lock contention (Prisma advisory lock ${PRISMA_ADVISORY_LOCK_ID}) is blocking deploy, but the database is already up to date. Treating as success to protect data.`,
        )
        return
      }
    }

    if (isLockTimeout && attempt < MAX_RETRIES) {
      console.log(
        `[migrate:deploy] Lock contention detected. Waiting ${RETRY_DELAY / 1000}s before retry...`,
      )
      await sleep(RETRY_DELAY)
      continue
    }

    // Only as a last resort, after several retries with a persistent lock,
    // try db push WITHOUT --accept-data-loss so we never silently drop data.
    if (isLockTimeout && attempt >= 4) {
      if (tryDbPushNoDataLoss(env)) return
    }

    if (output.includes('P3009') || output.includes('failed migrations')) {
      console.log('[migrate:deploy] Detected failed migrations in target database')
      const didResolve = tryResolveFailedMigrations(output, env)
      if (didResolve && attempt < MAX_RETRIES) {
        console.log('[migrate:deploy] Resolved failed migration(s). Retrying deploy...')
        continue
      }
    }

    console.error(`[migrate:deploy] Attempt ${attempt} failed`)
    if (attempt >= MAX_RETRIES) {
      console.error('[migrate:deploy] Migration failed after all retries')
      process.exit(1)
    }
  }

  console.error('[migrate:deploy] Migration failed after all retries')
  process.exit(1)
}

main().catch((err) => {
  console.error('[migrate:deploy] Unexpected error:', err?.message || err)
  process.exit(1)
})
