-- CreateTable
CREATE TABLE "circular_tabs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image_url" TEXT,
    "image_key" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "circular_tabs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "circular_tabs_key_key" ON "circular_tabs"("key");

-- CreateIndex
CREATE INDEX "circular_tabs_display_order_asc" ON "circular_tabs"("display_order" ASC);

-- Insert default circular tabs
INSERT INTO "circular_tabs" ("id", "key", "title", "display_order", "created_at", "updated_at") VALUES
  (gen_random_uuid(), 'portfolio', 'Portfolio', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'services', 'Services', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'virtual_design', 'Virtual Design', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'shop_with_us', 'Shop With Us', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'blog', 'Blog', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'about_us', 'About Us', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'socials', 'Socials', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'testimonials', 'Testimonials', 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'work_with_us', 'Work With Us', 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
