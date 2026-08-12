-- AlterTable
ALTER TABLE "password_resets" ADD COLUMN     "user_id" TEXT,
ALTER COLUMN "admin_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "password_resets_user_id_token_idx" ON "password_resets"("user_id", "token");
