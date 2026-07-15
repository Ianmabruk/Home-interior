ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "before_after_images" JSONB;
ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "gallery" JSONB;

CREATE INDEX "portfolios_order_idx" ON "portfolios"("order");
CREATE INDEX "portfolios_is_published_idx" ON "portfolios"("is_published");
