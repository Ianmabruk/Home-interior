-- AlterTable
ALTER TABLE "work_with_us" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'submission';
ALTER TABLE "work_with_us" ADD COLUMN "title" TEXT;
ALTER TABLE "work_with_us" ADD COLUMN "description" TEXT;
ALTER TABLE "work_with_us" ADD COLUMN "image_url" TEXT;
ALTER TABLE "work_with_us" ADD COLUMN "media_urls" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "work_with_us" ADD COLUMN "cloudinary_id" TEXT;
ALTER TABLE "work_with_us" ADD COLUMN "display_order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "work_with_us" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "work_with_us_type_displayOrder_asc" ON "work_with_us"("type", "display_order" ASC);
