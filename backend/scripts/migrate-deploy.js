#!/usr/bin/env node
import { execSync } from 'child_process'

const MAX_RETRIES = 2
const LOCK_TIMEOUT = 60000
const RETRY_DELAY = 3000

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
  console.log(`[migrate:deploy] Attempt ${attempt}/${MAX_RETRIES}`)
  try {
    execSync(`PRISMA_MIGRATE_LOCK_TIMEOUT=${LOCK_TIMEOUT} prisma migrate deploy`, {
      stdio: 'inherit',
      env: { ...process.env, PRISMA_MIGRATE_LOCK_TIMEOUT: String(LOCK_TIMEOUT) },
    })
    console.log('[migrate:deploy] Migrations applied successfully')
    process.exit(0)
  } catch (err) {
    const msg = err?.message || String(err)
    const isLockTimeout = msg.includes('advisory lock') || msg.includes('P1002')
    console.error(`[migrate:deploy] Attempt ${attempt} failed:`, msg.slice(0, 200))

    if (attempt < MAX_RETRIES && isLockTimeout) {
      console.log(`[migrate:deploy] Waiting ${RETRY_DELAY / 1000}s before retry...`)
      await sleep(RETRY_DELAY)
    } else {
      console.error('[migrate:deploy] migrate deploy failed, falling back to db push')
      try {
        execSync('prisma db push', {
          stdio: 'inherit',
          env: { ...process.env, PRISMA_MIGRATE_LOCK_TIMEOUT: '0' },
        })
        console.log('[migrate:deploy] db push completed successfully')
        process.exit(0)
      } catch (pushErr) {
        console.error('[migrate:deploy] db push also failed:', pushErr?.message || String(pushErr).slice(0, 200))
        process.exit(1)
      }
    }
  }
}

process.exit(1)
