/*
  Safe idempotent migration for adding variant tables and settings.
  Uses IF NOT EXISTS / IF EXISTS so re-runs do not fail on partial state.
*/

-- AlterTable: add missing abouts columns safely
ALTER TABLE "abouts" ADD COLUMN IF NOT EXISTS "statistics" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "values" TEXT NOT NULL DEFAULT '';

-- AlterTable: restructure products safely
ALTER TABLE "products" DROP COLUMN IF EXISTS "color_variants",
DROP COLUMN IF EXISTS "style_variants",
ADD COLUMN IF NOT EXISTS "main_image" TEXT,
ADD COLUMN IF NOT EXISTS "storage_paths" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable: product variants safe
CREATE TABLE IF NOT EXISTS "product_variants" (
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

-- CreateIndex: safe
CREATE INDEX IF NOT EXISTS "product_variants_product_id_idx" ON "product_variants"("product_id");

-- AddForeignKey: safe via DO block
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'product_variants_product_id_fkey'
          AND table_name = 'product_variants'
    ) THEN
        ALTER TABLE "product_variants"
        ADD CONSTRAINT "product_variants_product_id_fkey"
        FOREIGN KEY ("product_id") REFERENCES "products"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
