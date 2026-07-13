-- Migration: add the projects.tags column that was missing on the live
-- PostgreSQL database (root cause of P2022 on GET /api/content/projects and
-- POST /api/content/projects). The projects.services column is added again
-- here with IF NOT EXISTS so this migration is safe to run even if a prior
-- migration already created it.
--
-- IF NOT EXISTS makes the migration idempotent and additive — no existing data
-- is touched and no destructive change is made. No default is required because
-- both columns are nullable JSONB.
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "tags" JSONB;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "services" JSONB;
