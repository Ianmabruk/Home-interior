import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'

function run(command) {
  try {
    console.log(`> ${command}`)
    execSync(command, { stdio: 'inherit', env: process.env })
  } catch (err) {
    console.error(`Command failed: ${command}`)
    throw err
  }
}

function fileExists(path) {
  return existsSync(path)
}

async function migrateWithRetry(maxAttempts = 3, delayMs = 5000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      run('npx prisma migrate deploy')
      console.log('Migrations applied')
      return
    } catch (err) {
      console.warn(`migrate deploy failed (attempt ${attempt}): ${err.message}`)
      if (attempt === maxAttempts) {
        console.warn('Falling back to prisma db push ...')
        try {
          run('npx prisma db push')
          console.log('Schema pushed with db push')
          return
        } catch (pushErr) {
          console.error('db push also failed:', pushErr.message)
          throw pushErr
        }
      }
      console.log(`Retrying in ${delayMs}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

try {
  run('npx prisma generate')
  await migrateWithRetry()
  run('node src/seeds/seed.js')
  run('node src/server.js')
} catch (err) {
  console.error('Startup failed:', err)
  process.exit(1)
}
