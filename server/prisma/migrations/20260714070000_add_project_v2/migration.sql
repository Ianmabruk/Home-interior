-- Create ProjectV2 table for the new video-only project system.
CREATE TABLE "project_v2" (
  "_id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "video_url" TEXT NOT NULL,
  "video_public_id" TEXT NOT NULL,
  "thumbnail_url" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "is_published" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT now(),

  CONSTRAINT "project_v2__id_pkey" PRIMARY KEY ("_id")
);

-- Indexes for ordering and publication queries
CREATE INDEX "project_v2_order_idx" ON "project_v2"("order");
CREATE INDEX "project_v2_published_idx" ON "project_v2"("is_published");
