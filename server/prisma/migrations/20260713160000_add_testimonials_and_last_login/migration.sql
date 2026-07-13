-- Add Testimonial model + User.lastLoginAt (FIX #2 + FIX #3)

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "testimonials" (
    "_id" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "position" TEXT,
    "company" TEXT,
    "testimonial" TEXT NOT NULL,
    "photo_url" TEXT,
    "photo_public_id" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("_id")
);

CREATE INDEX IF NOT EXISTS "testimonials_display_order_idx" ON "testimonials" ("display_order");
CREATE INDEX IF NOT EXISTS "testimonials_is_active_idx" ON "testimonials" ("is_active");
