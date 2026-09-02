-- Add package-specific fields to virtual_designs
-- Supports eDesign package management from admin dashboard

-- AlterTable
ALTER TABLE "virtual_designs" ADD COLUMN "price" DOUBLE PRECISION;
ALTER TABLE "virtual_designs" ADD COLUMN "currency" TEXT DEFAULT 'KES';
ALTER TABLE "virtual_designs" ADD COLUMN "price_suffix" TEXT DEFAULT '';
ALTER TABLE "virtual_designs" ADD COLUMN "features" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "virtual_designs" ADD COLUMN "cta_text" TEXT DEFAULT 'Book';
ALTER TABLE "virtual_designs" ADD COLUMN "tagline" TEXT;
ALTER TABLE "virtual_designs" ADD COLUMN "package_type" TEXT;

-- CreateIndex
CREATE INDEX "virtual_designs_packageType_idx" ON "virtual_designs"("package_type");
