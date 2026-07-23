/*
  Warnings:

  - You are about to drop the column `color_variants` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `style_variants` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "abouts" ADD COLUMN     "statistics" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "values" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "products" DROP COLUMN "color_variants",
DROP COLUMN "style_variants",
ADD COLUMN     "main_image" TEXT,
ADD COLUMN     "storage_paths" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "image" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION,
    "storage_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
