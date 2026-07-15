-- Create enum type for product categories
CREATE TYPE "ProductCategory" AS ENUM ('Mirrors', 'Frames', 'Throw Pillows');

-- Alter products.category column to use the enum
-- Map old categories to new ones:
--   Living Room, Bedroom, Outdoor → Throw Pillows
--   Kitchen, Dining, Lighting, Office, Commercial, Decor, Custom Designs → Frames
ALTER TABLE "products" 
  ALTER COLUMN "category" TYPE "ProductCategory" 
  USING CASE 
    WHEN "category" IN ('Living Room', 'Bedroom', 'Outdoor') THEN 'Throw Pillows'::"ProductCategory"
    WHEN "category" IN ('Kitchen', 'Dining', 'Lighting', 'Office', 'Commercial', 'Decor', 'Custom Designs') THEN 'Frames'::"ProductCategory"
    WHEN "category" = 'Mirrors' THEN 'Mirrors'::"ProductCategory"
    ELSE 'Frames'::"ProductCategory"
  END;

-- Create index on category for query performance
CREATE INDEX "products_category_idx" ON "products"("category");

-- Create index on isPublished for query performance
CREATE INDEX "products_is_published_idx" ON "products"("is_published");

-- Create index on sku (should already be unique, but add index for lookups)
CREATE INDEX "products_sku_idx" ON "products"("sku");
