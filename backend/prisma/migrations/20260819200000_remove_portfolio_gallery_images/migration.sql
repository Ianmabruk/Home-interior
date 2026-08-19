-- Migrate existing gallery images (media_urls) to before_images for backward compatibility
UPDATE "portfolios"
SET "before_images" = "media_urls"
WHERE "media_urls" IS NOT NULL
  AND array_length("media_urls", 1) > 0
  AND ("before_images" IS NULL OR array_length("before_images", 1) = 0);

-- Remove the gallery images column (no longer needed)
ALTER TABLE "portfolios" DROP COLUMN IF EXISTS "media_urls";
