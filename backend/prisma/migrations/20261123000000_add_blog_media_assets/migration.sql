ALTER TABLE "blogs"
ADD COLUMN "media_assets" JSONB NOT NULL DEFAULT '[]'::jsonb;
