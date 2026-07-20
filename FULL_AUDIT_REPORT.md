# Phase 2 Audit Report

Generated from: `debug/prisma-investigation` branch

## DATABASE_URL References

| FILE | LINE | CODE | PURPOSE |
|------|------|------|---------|
| `server/src/config/env.js` | 4 | `if (isProd && !process.env.DATABASE_URL) missing.push('DATABASE_URL')` | Production validation check |
| `server/src/config/env.js` | 22 | `databaseUrl: process.env.DATABASE_URL \|\| ''` | Export to app |
| `server/src/index.js` | 8 | `console.log(\`  DATABASE_URL : ${dbUrl ? 'configured' : '❌ NOT SET'}\`)` | Startup banner |
| `server/src/config/prisma.js` | 12 | `url: env.databaseUrl` | Explicit Prisma datasource URL |
| `server/prisma/schema.prisma` | 8 | `url = env("DATABASE_URL")` | Prisma schema datasource |
| `render.yaml` | 22-23 | `key: DATABASE_URL` / value | Render platform env var |

## DIRECT_URL References

| FILE | LINE | CODE | PURPOSE |
|------|------|------|---------|
| `server/src/config/env.js` | 23 | `directUrl: process.env.DIRECT_URL \|\| ''` | Export to app |
| `server/src/index.js` | 9 | `console.log(\`  DIRECT_URL   : ${env.directUrl ? 'configured' : '❌ NOT SET'}\`)` | Startup banner |
| `server/prisma/schema.prisma` | 9 | `directUrl = env("DIRECT_URL")` | Prisma schema direct connection |
| `render.yaml` | 24-25 | `key: DIRECT_URL` / value | Render platform env var |

## dotenv / dotenvx Usage

| FILE | LINE | CODE | PURPOSE |
|------|------|------|---------|
| `server/src/seeds/seedAdmin.js` | 2,6 | `import dotenv ... dotenv.config()` | Seed script local env |
| `server/src/seeds/seed.js` | 2,18 | `import dotenv ... dotenv.config()` | Seed script local env |

**FINDING:** `dotenv` is ONLY used in seed scripts. `env.js` does NOT call `dotenv.config()` (removed in commit `101bf0a`). No `dotenvx` usage found anywhere.

## process.env References (non-dev)

| FILE | LINE | CODE | PURPOSE |
|------|------|------|---------|
| `server/src/config/prisma.js` | 17 | `process.env.NODE_ENV !== 'production'` | Dev-mode global caching |
| `server/src/config/env.js` | 1 | `process.env.NODE_ENV === 'production'` | Prod checks |
| `server/src/config/env.js` | 20-37 | Various `process.env.*` | All env var exports |

## PrismaClient Instantiation

| FILE | LINE | CODE | PURPOSE |
|------|------|------|---------|
| `server/src/config/prisma.js` | 8 | `new PrismaClient({...})` | **SINGLETON** - only instance |

**FINDING:** Exactly ONE `new PrismaClient()` exists in the entire codebase.

## Missing Required Environment Variables

| FILE | LINE | CODE | PURPOSE |
|------|------|------|---------|
| `server/src/config/env.js` | 12 | `console.error('❌ Missing required environment variables:', ...)` | Prod validation banner |

## connectDB Usage

| FILE | LINE | CODE | PURPOSE |
|------|------|------|---------|
| `server/src/config/prisma.js` | 76-94 | `export const connectDB` | Startup connection with retry |
| `server/src/config/db.js` | 1 | `export { prisma, executeWithRetry, connectDB }` | Re-export barrel |

## Duplicate datasource Definitions

`server/prisma/schema.prisma` has exactly ONE `datasource db { ... }` block (lines 6-11).

## $disconnect / $connect in Request Paths

| FILE | LINE | CODE | PURPOSE |
|------|------|------|---------|
| `server/src/config/prisma.js` | 82 | `await prisma.$connect()` | Startup connect only |
| `server/src/seeds/seedAdmin.js` | 36,39 | `await prisma.$disconnect()` | Seed cleanup (acceptable) |
| `server/src/seeds/seed.js` | 90,94 | `await prisma.$disconnect()` | Seed cleanup (acceptable) |

**FINDING:** NO `$disconnect()`/`$connect()` inside request handlers or retry logic.

## DATABASE_URL Reassignment

Search for `process.env.DATABASE_URL =` found NO matches. URL is never modified after process start.
