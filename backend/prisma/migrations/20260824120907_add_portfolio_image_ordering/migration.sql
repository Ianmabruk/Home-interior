-- Create portfolio_images table for explicit image ordering
CREATE TABLE IF NOT EXISTS "portfolio_images" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "portfolio_project_id" TEXT NOT NULL,
  "image_url" TEXT NOT NULL,
  "image_type" TEXT NOT NULL DEFAULT 'before',
  "cloudinary_id" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Foreign key to portfolios table
ALTER TABLE "portfolio_images"
  ADD CONSTRAINT "portfolio_images_portfolio_project_id_fkey"
  FOREIGN KEY ("portfolio_project_id")
  REFERENCES "portfolios" ("id")
  ON DELETE CASCADE;

-- Index for efficient ordering queries
CREATE INDEX IF NOT EXISTS "portfolio_images_portfolio_project_id_image_type_sort_order_idx"
  ON "portfolio_images" ("portfolio_project_id", "image_type", "sort_order" ASC);

-- Backfill: migrate existing before_images arrays into portfolio_images table
-- Uses WITH ORDINALITY to get each array element's 1-based position, converted to 0-based sort_order
INSERT INTO "portfolio_images" ("portfolio_project_id", "image_url", "image_type", "sort_order", "created_at", "updated_at")
SELECT
  p."id",
  elem.url,
  'before' AS "image_type",
  elem.idx - 1 AS "sort_order",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "portfolios" p,
  LATERAL UNNEST(p."before_images") WITH ORDINALITY AS elem(url, idx)
WHERE p."before_images" IS NOT NULL AND array_length(p."before_images", 1) > 0;

-- Backfill: migrate existing after_images arrays into portfolio_images table
INSERT INTO "portfolio_images" ("portfolio_project_id", "image_url", "image_type", "sort_order", "created_at", "updated_at")
SELECT
  p."id",
  elem.url,
  'after' AS "image_type",
  elem.idx - 1 AS "sort_order",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "portfolios" p,
  LATERAL UNNEST(p."after_images") WITH ORDINALITY AS elem(url, idx)
WHERE p."after_images" IS NOT NULL AND array_length(p."after_images", 1) > 0;

-- Trigger to auto-update updated_at on portfolio_images
CREATE OR REPLACE FUNCTION trigger_update_portfolio_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS "portfolio_images_updated_at_trigger"
  BEFORE UPDATE ON "portfolio_images"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_portfolio_images_updated_at();
