ALTER TABLE "blogs"
ADD COLUMN "video_original_bytes" INTEGER;

ALTER TABLE "virtual_designs"
ADD COLUMN "media_assets" JSONB NOT NULL DEFAULT '[]'::jsonb;
