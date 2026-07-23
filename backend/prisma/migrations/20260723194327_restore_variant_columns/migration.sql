-- AlterTable
ALTER TABLE "products" ADD COLUMN     "color_variants" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "style_variants" TEXT[] DEFAULT ARRAY[]::TEXT[];
