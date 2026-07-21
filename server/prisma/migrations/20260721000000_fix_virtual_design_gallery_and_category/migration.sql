-- Fix virtual_designs schema:
-- 1. Change gallery_media from text[] to jsonb to support {url, type} objects
-- 2. Add category column

-- Fix portfolios schema:
-- 1. Add category column

-- Drop the old default on virtual_designs.gallery_media
ALTER TABLE "virtual_designs" ALTER COLUMN "gallery_media" DROP DEFAULT;

-- Convert existing text[] to jsonb.
-- Empty arrays become [].
-- String arrays become ["url1","url2"].
ALTER TABLE "virtual_designs" ALTER COLUMN "gallery_media" TYPE JSONB USING
  CASE
    WHEN "gallery_media" IS NULL THEN NULL
    ELSE to_json("gallery_media")
  END;

-- Set new default as jsonb
ALTER TABLE "virtual_designs" ALTER COLUMN "gallery_media" SET DEFAULT '[]'::jsonb;

-- Add category column to virtual_designs
ALTER TABLE "virtual_designs" ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'General';

-- Add category column to portfolios
ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'General';
