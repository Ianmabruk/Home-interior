#!/usr/bin/env node
import { execSync, spawnSync } from 'child_process'

const MAX_RETRIES = 5
const RETRY_DELAY = 10000
const COMMAND_TIMEOUT = 180000

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  console.log('[migrate:deploy] Applying pending migrations...')

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[migrate:deploy] Attempt ${attempt}/${MAX_RETRIES}`)
    try {
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        timeout: COMMAND_TIMEOUT,
        env: {
          ...process.env,
          PGCONNECT_TIMEOUT: '60',
        },
      })
      console.log('[migrate:deploy] Migrations applied successfully')
      return
    } catch (err) {
      const msg = err?.message || String(err)
      const isLockTimeout =
        msg.includes('advisory lock') ||
        msg.includes('P1002') ||
        msg.includes('ETIMEDOUT') ||
        msg.includes('timeout')
      console.error(`[migrate:deploy] Attempt ${attempt} failed:`, msg.slice(0, 300))

      if (isLockTimeout && attempt < MAX_RETRIES) {
        console.log(`[migrate:deploy] Lock contention detected. Waiting ${RETRY_DELAY / 1000}s before retry...`)
        await sleep(RETRY_DELAY)
      } else {
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
