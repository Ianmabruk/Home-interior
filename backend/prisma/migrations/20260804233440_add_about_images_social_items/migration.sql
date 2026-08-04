-- AlterTable
ALTER TABLE "abouts" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT 'About Us';
ALTER TABLE "abouts" ADD COLUMN IF NOT EXISTS "subtitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "abouts" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "abouts" ADD COLUMN IF NOT EXISTS "experience" TEXT NOT NULL DEFAULT '';
ALTER TABLE "abouts" ADD COLUMN IF NOT EXISTS "button_text" TEXT NOT NULL DEFAULT '';
ALTER TABLE "abouts" ADD COLUMN IF NOT EXISTS "button_url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "abouts" ADD COLUMN IF NOT EXISTS "projects_completed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "abouts" ADD COLUMN IF NOT EXISTS "happy_clients" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "abouts" ADD COLUMN IF NOT EXISTS "years_experience" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "abouts" ADD COLUMN IF NOT EXISTS "countries_served" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE IF NOT EXISTS "about_images" (
  "id" TEXT NOT NULL,
  "about_id" TEXT NOT NULL,
  "image_url" TEXT NOT NULL,
  "cloudinary_id" TEXT,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "about_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "social_items" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "image_url" TEXT,
  "cloudinary_id" TEXT,
  "link" TEXT NOT NULL,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "social_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "about_images_about_id_display_order_idx" ON "about_images"("about_id", "display_order");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "social_items_display_order_idx" ON "social_items"("display_order");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "social_items_is_active_display_order_idx" ON "social_items"("is_active", "display_order");

-- AddForeignKey
ALTER TABLE "about_images" ADD CONSTRAINT "about_images_about_id_fkey" FOREIGN KEY ("about_id") REFERENCES "abouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
