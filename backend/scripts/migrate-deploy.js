#!/usr/bin/env node
import { execSync } from 'child_process'

const MAX_RETRIES = 8
const RETRY_DELAY = 15000
const INITIAL_DELAY = 5000
const COMMAND_TIMEOUT = 300000

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// Neon pooler + advisory locks: use a direct connection for migrations
// by temporarily bypassing the pooler if DIRECT_DATABASE_URL is set
function buildEnv() {
  const env = { ...process.env, PGCONNECT_TIMEOUT: '60' }
  // If a direct (non-pooler) connection is available, use it for migrations
  // Advisory locks don't work well with PgBouncer transaction pooling
  if (env.DIRECT_DATABASE_URL && !env.DATABASE_URL.includes('-pooler')) {
    // Already using direct connection
  } else if (env.DIRECT_DATABASE_URL) {
    console.log('[migrate:deploy] Using DIRECT_DATABASE_URL for migration (bypasses pooler)')
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

function extractFailedMigrationNames(output) {
  const names = []
  const regex = /The `([^`]+)` migration.*failed/g
  let match
  while ((match = regex.exec(output)) !== null) {
    if (!names.includes(match[1])) names.push(match[1])
  }
  return names
}

function tryResolveFailedMigrations(output) {
  const names = extractFailedMigrationNames(output)
  if (names.length === 0) return false

  console.log(`[migrate:deploy] Found failed migration(s): ${names.join(', ')}`)
  let resolved = false
  for (const name of names) {
    console.log(`[migrate:deploy] Marking ${name} as rolled back...`)
    try {
      const resolveOutput = execSync(`npx prisma migrate resolve --rolled-back ${name}`, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 60000,
        env,
        encoding: 'utf-8',
      })
      console.log(`[migrate:deploy] Successfully marked ${name} as rolled back`)
      resolved = true
    } catch (err) {
      const errOutput = (err?.stdout || '') + (err?.stderr || '') + (err?.message || '')
      console.warn(`[migrate:deploy] Could not resolve ${name}:`, errOutput.slice(0, 300))
    }
  }
  return resolved
}

async function main() {
  console.log('[migrate:deploy] Applying pending migrations...')
  
  // Initial wait to let any stale locks clear (Neon pooler can hold locks)
  console.log(`[migrate:deploy] Waiting ${INITIAL_DELAY / 1000}s for any stale locks to clear...`)
  await sleep(INITIAL_DELAY)

  const env = buildEnv()

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[migrate:deploy] Attempt ${attempt}/${MAX_RETRIES}`)

    let stdout, stderr
    try {
      const result = execSync('npx prisma migrate deploy', {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: COMMAND_TIMEOUT,
        env,
        encoding: 'utf-8',
      })
      stdout = result || ''
      console.log(stdout)
      console.log('[migrate:deploy] Migrations applied successfully')
      return
    } catch (err) {
      stdout = (err?.stdout || '') || ''
      stderr = (err?.stderr || '') || ''
      console.error(stdout)
      console.error(stderr)

      const output = stdout + stderr + (err?.message || '')
      const isLockTimeout =
        output.includes('advisory lock') ||
        output.includes('P1002') ||
        output.includes('ETIMEDOUT') ||
        output.includes('timeout')

      if (isLockTimeout && attempt < MAX_RETRIES) {
        console.log(`[migrate:deploy] Lock contention detected. Waiting ${RETRY_DELAY / 1000}s before retry...`)
        await sleep(RETRY_DELAY)
        continue
      }

      // If lock persists after several retries, try prisma db push as fallback
      // db push doesn't use advisory locks and works better with Neon pooler
      if (isLockTimeout && attempt >= 4) {
        console.log('[migrate:deploy] Lock persists. Attempting fallback with prisma db push (no advisory locks)...')
        try {
          const pushResult = execSync('npx prisma db push --skip-generate --accept-data-loss', {
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: COMMAND_TIMEOUT,
            env,
            encoding: 'utf-8',
          })
          console.log(pushResult)
          console.log('[migrate:deploy] Schema synced via db push (fallback)')
          return
        } catch (pushErr) {
          const pushOutput = (pushErr?.stdout || '') + (pushErr?.stderr || '')
          console.error('[migrate:deploy] db push fallback failed:', pushOutput.slice(0, 500))
        }
      }

      if (output.includes('P3009') || output.includes('failed migrations')) {
        console.log('[migrate:deploy] Detected failed migrations in target database')
        const didResolve = tryResolveFailedMigrations(output)
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
  }

  console.error('[migrate:deploy] Migration failed after all retries')
  process.exit(1)
}

main().catch((err) => {
  console.error('[migrate:deploy] Unexpected error:', err?.message || err)
  process.exit(1)
})
