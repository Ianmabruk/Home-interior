#!/usr/bin/env node
import { execSync, spawnSync } from 'child_process'

const MAX_RETRIES = 5
const RETRY_DELAY = 10000
const COMMAND_TIMEOUT = 180000

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function tryMigrateDeploy() {
  return execSync('npx prisma migrate deploy', {
    stdio: 'pipe',
    timeout: COMMAND_TIMEOUT,
    env: { ...process.env, PGCONNECT_TIMEOUT: '60' },
    encoding: 'utf-8',
  })
}

function tryMigrateResolve(migrationName, action) {
  return execSync(`npx prisma migrate resolve --${action} ${migrationName}`, {
    stdio: 'pipe',
    timeout: 60000,
    env: { ...process.env, PGCONNECT_TIMEOUT: '60' },
    encoding: 'utf-8',
  })
}

function getFailedMigrationName(output) {
  const match = output.match(/Migration name:\s*(\S+)/)
  return match ? match[1] : null
}

async function main() {
  console.log('[migrate:deploy] Applying pending migrations...')

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[migrate:deploy] Attempt ${attempt}/${MAX_RETRIES}`)
    try {
      tryMigrateDeploy()
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

      if (output.includes('P3018') || output.includes('failed to apply')) {
        const migrationName = getFailedMigrationName(output)
        if (migrationName) {
          console.log(`[migrate:deploy] Migration ${migrationName} failed. Attempting to resolve...`)
          try {
            tryMigrateResolve(migrationName, 'rolled-back')
            console.log(`[migrate:deploy] Marked ${migrationName} as rolled back. Retrying deploy...`)
          } catch (resolveErr) {
            console.warn(`[migrate:deploy] Could not resolve migration: ${resolveErr.message?.slice(0, 200)}`)
          }
        }
      }

      console.error(`[migrate:deploy] Attempt ${attempt} failed:`, output.slice(0, 500))
      if (attempt >= MAX_RETRIES) {
        console.error('[migrate:deploy] Migration failed after all retries')
        process.exit(1)
      }
    }
  }
}

main().catch((err) => {
  console.error('[migrate:deploy] Unexpected error:', err?.message || err)
  process.exit(1)
})
