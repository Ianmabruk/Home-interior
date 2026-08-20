-- AddHomepageCircularImageToPortfolioAndVirtualDesign

-- Add homepage_circular_image and homepage_circular_image_id to portfolios
ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "homepage_circular_image" TEXT;
ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "homepage_circular_image_id" TEXT;

-- Add homepage_circular_image and homepage_circular_image_id to virtual_designs
ALTER TABLE "virtual_designs" ADD COLUMN IF NOT EXISTS "homepage_circular_image" TEXT;
ALTER TABLE "virtual_designs" ADD COLUMN IF NOT EXISTS "homepage_circular_image_id" TEXT;
