-- Added video metadata columns (additive, nullable — preserves existing blog records)
ALTER TABLE "blogs" ADD COLUMN "video_cloudinary_id" TEXT;
ALTER TABLE "blogs" ADD COLUMN "video_resource_type" TEXT;
ALTER TABLE "blogs" ADD COLUMN "video_format" TEXT;
ALTER TABLE "blogs" ADD COLUMN "video_mime_type" TEXT;
ALTER TABLE "blogs" ADD COLUMN "video_duration" DOUBLE PRECISION;
ALTER TABLE "blogs" ADD COLUMN "video_width" INTEGER;
ALTER TABLE "blogs" ADD COLUMN "video_height" INTEGER;
ALTER TABLE "blogs" ADD COLUMN "video_bytes" INTEGER;
ALTER TABLE "blogs" ADD COLUMN "video_original_name" TEXT;
