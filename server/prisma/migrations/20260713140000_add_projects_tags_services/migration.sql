-- Adds the columns that the live PostgreSQL `projects` table is missing
-- (they were defined in schema.prisma + the 20260712174637 migration but that
-- migration never ran on Render, because the deploy had no migration step).
-- prisma.project.findMany() queries these columns, so their absence caused
-- P2022 and 500'd GET /api/content/projects (and, via aggregation, /content/homepage).
-- IF NOT EXISTS keeps this idempotent and safe to re-run.
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "tags" JSONB;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "services" JSONB;
