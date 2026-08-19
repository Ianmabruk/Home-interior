-- AlterTable
ALTER TABLE "portfolios" ADD COLUMN "before_images" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "portfolios" ADD COLUMN "after_images" TEXT[] DEFAULT ARRAY[]::TEXT[];
