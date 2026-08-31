-- Backfill deterministic displayOrder for existing portfolio projects.
-- Ordered newest-first (createdAt DESC) so the default admin/public listing
-- matches the historical ordering the admin left in place. This guarantees a
-- stable, gap-free ordering and prevents random/insertion-order display before
-- any manual reordering occurs.
UPDATE "portfolios" AS p
SET "display_order" = sub.rn - 1
FROM (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "created_at" DESC, "id" DESC) AS rn
  FROM "portfolios"
) AS sub
WHERE p."id" = sub."id";
