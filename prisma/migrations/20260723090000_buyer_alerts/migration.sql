-- AlterTable
ALTER TABLE "SavedVehicle" ADD COLUMN "lastPrice" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "SavedSearch" ADD COLUMN "lastNotifiedAt" TIMESTAMP(3);
