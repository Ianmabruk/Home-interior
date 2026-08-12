-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "color_variants" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "style_variants" TEXT[] DEFAULT ARRAY[]::TEXT[];
