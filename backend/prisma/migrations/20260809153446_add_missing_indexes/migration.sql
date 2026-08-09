/*
  Warnings:

  - You are about to drop the column `statistics` on the `abouts` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "blogs_views_idx";

-- AlterTable
ALTER TABLE "about_images" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "abouts" DROP COLUMN "statistics";

-- AlterTable
ALTER TABLE "social_items" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "hero_media_display_order_is_active_idx" ON "hero_media"("display_order", "is_active");

-- CreateIndex
CREATE INDEX "messages_is_read_created_at_idx" ON "messages"("is_read", "created_at");

-- CreateIndex
CREATE INDEX "portfolios_featured_created_at_idx" ON "portfolios"("featured", "created_at");

-- CreateIndex
CREATE INDEX "products_in_stock_featured_display_order_idx" ON "products"("in_stock", "featured", "display_order");

-- CreateIndex
CREATE INDEX "products_created_at_idx" ON "products"("created_at");

-- CreateIndex
CREATE INDEX "services_display_order_is_active_idx" ON "services"("display_order", "is_active");

-- CreateIndex
CREATE INDEX "testimonials_display_order_is_active_idx" ON "testimonials"("display_order", "is_active");

-- CreateIndex
CREATE INDEX "virtual_designs_published_display_order_idx" ON "virtual_designs"("published", "display_order");
