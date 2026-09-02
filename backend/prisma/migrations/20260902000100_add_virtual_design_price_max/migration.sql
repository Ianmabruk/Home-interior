-- Add priceMax to virtual_designs for package price ranges

-- AlterTable
ALTER TABLE "virtual_designs" ADD COLUMN "price_max" DOUBLE PRECISION;
