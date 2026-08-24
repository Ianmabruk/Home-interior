#!/usr/bin/env node
import { execSync, spawnSync } from 'child_process'

const MAX_RETRIES = 5
const RETRY_DELAY = 10000
const COMMAND_TIMEOUT = 180000

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

const env = { ...process.env, PGCONNECT_TIMEOUT: '60' }

function run(cmd, opts = {}) {
  return spawnSync(cmd, {
    shell: true,
    stdio: 'pipe',
    encoding: 'utf-8',
    timeout: opts.timeout || COMMAND_TIMEOUT,
    env,
    ...opts,
  })
}

function getFailedMigrationNames(output) {
  const names = []
  const regex = /The `([^`]+)` migration started/
  let match
  const text = (output.stdout || '') + (output.stderr || '')
  while ((match = regex.exec(text)) !== null) {
    if (!names.includes(match[1])) names.push(match[1])
  }
  return names
}

function resolveFailedMigrations() {
  console.log('[migrate:deploy] Checking for failed migrations to resolve...')

  const result = run('npx prisma migrate deploy --skip-generate', { timeout: 60000 })
  const output = (result.stdout || '') + (result.stderr || '')

  if (output.includes('P3009') || output.includes('failed migrations')) {
    const names = getFailedMigrationNames({ stdout: result.stdout, stderr: result.stderr })
    console.log(`[migrate:deploy] Found failed migrations: ${names.join(', ')}`)

    for (const name of names) {
      console.log(`[migrate:deploy] Resolving (rolling back) failed migration: ${name}`)
      const resolveResult = run(`npx prisma migrate resolve --rolled-back ${name}`, { timeout: 60000 })
      if (resolveResult.status !== 0) {
        console.warn(`[migrate:deploy] Could not resolve ${name}:`, (resolveResult.stderr || '').slice(0, 300))
      } else {
        console.log(`[migrate:deploy] Successfully marked ${name} as rolled back`)
      }
    }
  } else {
    console.log('[migrate:deploy] No failed migrations to resolve')
  }
}

async function main() {
  console.log('[migrate:deploy] Applying pending migrations...')

  resolveFailedMigrations()

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[migrate:deploy] Attempt ${attempt}/${MAX_RETRIES}`)

    const result = run('npx prisma migrate deploy', { timeout: COMMAND_TIMEOUT })
    const output = (result.stdout || '') + (result.stderr || '')

    if (result.status === 0) {
      console.log('[migrate:deploy] Migrations applied successfully')
      return
    }

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

    console.error(`[migrate:deploy] Attempt ${attempt} failed:`, output.slice(0, 500))
    if (attempt >= MAX_RETRIES) {
      console.error('[migrate:deploy] Migration failed after all retries')
      process.exit(1)
    }
  }
}

main().catch((err) => {
  console.error('[migrate:deploy] Unexpected error:', err?.message || err)
  process.exit(1)
})
