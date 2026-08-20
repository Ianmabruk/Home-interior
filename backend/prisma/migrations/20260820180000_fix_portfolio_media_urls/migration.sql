-- Fix portfolio media_urls column drift
-- This migration is idempotent: safe to run whether or not the column exists
-- It ensures the portfolios table matches the current Prisma schema
ALTER TABLE "portfolios" DROP COLUMN IF EXISTS "media_urls";
