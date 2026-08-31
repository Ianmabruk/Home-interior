-- Re-normalize portfolio displayOrder to newest-first (createdAt DESC) so the
-- default admin and public listings match the historical ordering that existed
-- before manual reordering was introduced. This is idempotent: re-running it
-- produces the same result. It only writes the display_order column and never
-- touches project content or image relationships.
UPDATE "portfolios" AS p
SET "display_order" = sub.rn - 1
FROM (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "created_at" DESC, "id" DESC) AS rn
  FROM "portfolios"
) AS sub
WHERE p."id" = sub."id";
