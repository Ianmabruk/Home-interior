#!/usr/bin/env node
import { execSync } from 'child_process'

const MAX_RETRIES = 3
const LOCK_TIMEOUT = 120000
const RETRY_DELAY = 5000

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
  console.log(`[migrate:deploy] Attempt ${attempt}/${MAX_RETRIES}`)
  try {
    execSync('prisma migrate deploy', {
      stdio: 'inherit',
      env: {
        ...process.env,
        PRISMA_MIGRATE_LOCK_TIMEOUT: String(LOCK_TIMEOUT),
      },
    })
    console.log('[migrate:deploy] Migrations applied successfully')
    process.exit(0)
  } catch (err) {
    const msg = err?.message || String(err)
    const isLockTimeout = msg.includes('advisory lock') || msg.includes('P1002')
    console.error(`[migrate:deploy] Attempt ${attempt} failed:`, msg.slice(0, 300))

    if (attempt < MAX_RETRIES && isLockTimeout) {
      console.log(`[migrate:deploy] Lock contention detected. Waiting ${RETRY_DELAY / 1000}s before retry...`)
      await sleep(RETRY_DELAY)
    } else if (isLockTimeout) {
      console.error('[migrate:deploy] migrate deploy failed after all retries, falling back to db push')
      try {
        execSync('prisma db push --accept-data-loss', {
          stdio: 'inherit',
          env: {
            ...process.env,
            PRISMA_MIGRATE_LOCK_TIMEOUT: '0',
          },
        })
        console.log('[migrate:deploy] db push completed successfully')
        process.exit(0)
      } catch (pushErr) {
        console.error('[migrate:deploy] db push also failed:', pushErr?.message || String(pushErr).slice(0, 300))
        process.exit(1)
      }
    } else {
      console.error('[migrate:deploy] Non-lock error, falling back to db push')
      try {
        execSync('prisma db push --accept-data-loss', {
          stdio: 'inherit',
          env: {
            ...process.env,
            PRISMA_MIGRATE_LOCK_TIMEOUT: '0',
          },
        })
        console.log('[migrate:deploy] db push completed successfully')
        process.exit(0)
      } catch (pushErr) {
        console.error('[migrate:deploy] db push also failed:', pushErr?.message || String(pushErr).slice(0, 300))
        process.exit(1)
      }
    }
  }
}

process.exit(1)
