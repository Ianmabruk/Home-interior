-- DropIndex (use IF EXISTS because these indexes are created in a later migration)
DROP INDEX IF EXISTS "blogs_publish_date_idx";
DROP INDEX IF EXISTS "blogs_views_idx";

-- AlterTable
ALTER TABLE "blogs" ADD COLUMN     "media_urls" TEXT[] DEFAULT ARRAY[]::TEXT[];
