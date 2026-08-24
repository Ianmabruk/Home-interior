#!/usr/bin/env node
import { execSync } from 'child_process'

const MAX_RETRIES = 5
const RETRY_DELAY = 10000
const COMMAND_TIMEOUT = 180000

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

const env = { ...process.env, PGCONNECT_TIMEOUT: '60' }

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
      execSync(`npx prisma migrate resolve --rolled-back ${name}`, {
        stdio: 'pipe',
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

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[migrate:deploy] Attempt ${attempt}/${MAX_RETRIES}`)
    try {
      execSync('npx prisma migrate deploy', {
        stdio: 'pipe',
        timeout: COMMAND_TIMEOUT,
        env,
        encoding: 'utf-8',
      })
      console.log('[migrate:deploy] Migrations applied successfully')
      return
    } catch (err) {
      const output = (err?.stdout || '') + (err?.stderr || '') + (err?.message || String(err))

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

      if (output.includes('P3009') || output.includes('failed migrations')) {
        console.log('[migrate:deploy] Detected failed migrations in target database')
        const didResolve = tryResolveFailedMigrations(output)
        if (didResolve && attempt < MAX_RETRIES) {
          console.log('[migrate:deploy] Resolved failed migration(s). Retrying deploy...')
          continue
        }
      }

      console.error(`[migrate:deploy] Attempt ${attempt} failed:`, output.slice(0, 500))
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
