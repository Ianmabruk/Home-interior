-- Fix missing tables that were not created in production due to
-- earlier migrations being recorded as applied without executing DDL.
-- All statements are idempotent (IF NOT EXISTS) and safe to re-run.

CREATE TABLE IF NOT EXISTS "settings" (
  "_id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "site_name" TEXT DEFAULT 'HOK Interior Designs',
  "support_email" TEXT DEFAULT 'info@hokinterior.com',
  "maintenance_mode" BOOLEAN DEFAULT false,
  "currency" TEXT DEFAULT 'USD',
  "shipping_policy" TEXT DEFAULT '',
  "return_policy" TEXT DEFAULT '',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "settings_pkey" PRIMARY KEY ("_id")
);

CREATE TABLE IF NOT EXISTS "messages" (
  "_id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "sender_id" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "is_read" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "messages_pkey" PRIMARY KEY ("_id")
);

CREATE TABLE IF NOT EXISTS "analytics" (
  "_id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "date" TIMESTAMP(3) NOT NULL,
  "visits" INTEGER DEFAULT 0,
  "revenue" INTEGER DEFAULT 0,
  "orders" INTEGER DEFAULT 0,
  "new_users" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "analytics_pkey" PRIMARY KEY ("_id")
);

CREATE TABLE IF NOT EXISTS "newsletter_subscriptions" (
  "_id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "source" TEXT DEFAULT 'website',
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("_id")
);

CREATE TABLE IF NOT EXISTS "testimonials" (
  "_id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "client_name" TEXT NOT NULL,
  "position" TEXT,
  "content" TEXT NOT NULL,
  "rating" INTEGER DEFAULT 5,
  "image_url" TEXT,
  "cloudinary_id" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "display_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "testimonials_pkey" PRIMARY KEY ("_id")
);

CREATE TABLE IF NOT EXISTS "project_v2" (
  "_id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "video_url" TEXT NOT NULL,
  "video_public_id" TEXT NOT NULL,
  "thumbnail_url" TEXT,
  "thumbnail_public_id" TEXT,
  "title" TEXT,
  "description" TEXT,
  "services" JSONB,
  "before_after_images" JSONB,
  "category" TEXT,
  "tags" JSONB,
  "cta_primary" TEXT DEFAULT 'Start Your Project',
  "cta_secondary" TEXT DEFAULT 'Learn More',
  "is_published" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_v2_pkey" PRIMARY KEY ("_id")
);

CREATE INDEX IF NOT EXISTS "settings_created_at_idx" ON "settings"("created_at");
CREATE INDEX IF NOT EXISTS "messages_created_at_idx" ON "messages"("created_at");
CREATE INDEX IF NOT EXISTS "analytics_date_idx" ON "analytics"("date");
CREATE INDEX IF NOT EXISTS "newsletter_subscriptions_email_idx" ON "newsletter_subscriptions"("email");
CREATE INDEX IF NOT EXISTS "testimonials_display_order_idx" ON "testimonials"("display_order");
CREATE INDEX IF NOT EXISTS "testimonials_is_active_idx" ON "testimonials"("is_active");
CREATE INDEX IF NOT EXISTS "project_v2_is_published_idx" ON "project_v2"("is_published");
