-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tracking_number" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_note" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "estimated_delivery" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "orders_tracking_number_key" ON "orders"("tracking_number");
