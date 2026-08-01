-- AlterTable
ALTER TABLE "abouts" ADD COLUMN     "social_image" TEXT,
ADD COLUMN     "social_image_id" TEXT;

-- AlterTable
ALTER TABLE "consultations" ADD COLUMN     "budget" TEXT,
ADD COLUMN     "order_id" TEXT,
ADD COLUMN     "package_name" TEXT,
ADD COLUMN     "package_price" DOUBLE PRECISION,
ADD COLUMN     "payment_status" TEXT DEFAULT 'pending',
ADD COLUMN     "project_type" TEXT,
ADD COLUMN     "purchase_date" TIMESTAMP,
ADD COLUMN     "timeline" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'consultation';

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "button_text" TEXT DEFAULT 'Request This Service',
ADD COLUMN     "button_url" TEXT;

-- CreateIndex
CREATE INDEX "consultations_type_created_at_idx" ON "consultations"("type", "created_at");
