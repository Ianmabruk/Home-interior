-- AlterTable
ALTER TABLE "blogs" ADD COLUMN     "category" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "blogs_category_idx" ON "blogs"("category");
