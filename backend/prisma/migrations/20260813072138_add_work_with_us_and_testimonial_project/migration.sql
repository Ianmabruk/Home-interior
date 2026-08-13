-- AlterTable
ALTER TABLE "testimonials" ADD COLUMN     "project" TEXT;

-- CreateTable
CREATE TABLE "work_with_us" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "start_date" TEXT,
    "timeline" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_with_us_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_with_us_status_created_at_idx" ON "work_with_us"("status", "created_at");

-- CreateIndex
CREATE INDEX "work_with_us_email_idx" ON "work_with_us"("email");
