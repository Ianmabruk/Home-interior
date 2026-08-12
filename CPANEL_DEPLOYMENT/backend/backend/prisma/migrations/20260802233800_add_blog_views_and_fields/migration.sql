ALTER TABLE "blogs"
  ADD COLUMN "subtitle" TEXT,
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "content" TEXT,
  ADD COLUMN "author" TEXT,
  ADD COLUMN "meta_description" TEXT,
  ADD COLUMN "views" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "publish_date" TIMESTAMP(3);

CREATE INDEX "blogs_slug_idx" ON "blogs"("slug");
CREATE INDEX "blogs_publish_date_idx" ON "blogs"("publish_date");
CREATE INDEX "blogs_views_idx" ON "blogs"("views");