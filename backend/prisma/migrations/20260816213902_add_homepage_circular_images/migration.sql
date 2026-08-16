-- AlterTable
ALTER TABLE "blogs" ADD COLUMN     "homepage_circular_image" TEXT,
ADD COLUMN     "homepage_circular_image_id" TEXT;

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "homepage_circular_image" TEXT,
ADD COLUMN     "homepage_circular_image_id" TEXT;

-- AlterTable
ALTER TABLE "testimonials" ADD COLUMN     "homepage_circular_image" TEXT,
ADD COLUMN     "homepage_circular_image_id" TEXT,
ADD COLUMN     "initial" TEXT;

-- AlterTable
ALTER TABLE "work_with_us" ADD COLUMN     "homepage_circular_image" TEXT,
ADD COLUMN     "homepage_circular_image_id" TEXT;

-- CreateIndex
CREATE INDEX "orders_tracking_number_idx" ON "orders"("tracking_number");

-- RenameIndex
ALTER INDEX "work_with_us_type_displayOrder_asc" RENAME TO "work_with_us_type_display_order_idx";
