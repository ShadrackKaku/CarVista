-- Vehicle Passport: a permanent, VIN-anchored, append-only record of a vehicle's
-- life. Purely additive — creates new tables/enum, no changes to existing ones.

-- CreateEnum
CREATE TYPE "VehicleEventType" AS ENUM ('IMPORTED', 'SHIPPED', 'CLEARED', 'INSPECTED', 'LISTED', 'PRICE_CHANGE', 'SOLD', 'OWNERSHIP_TRANSFER', 'SERVICED', 'REPAIRED', 'INSURED', 'REGISTERED', 'MILEAGE_UPDATE', 'NOTE');

-- CreateTable
CREATE TABLE "VehiclePassport" (
    "id" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "vehicleId" TEXT,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehiclePassport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleEvent" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "type" "VehicleEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehiclePassport_vin_key" ON "VehiclePassport"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "VehiclePassport_vehicleId_key" ON "VehiclePassport"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleEvent_passportId_idx" ON "VehicleEvent"("passportId");

-- CreateIndex
CREATE INDEX "VehicleEvent_type_idx" ON "VehicleEvent"("type");

-- AddForeignKey
ALTER TABLE "VehiclePassport" ADD CONSTRAINT "VehiclePassport_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleEvent" ADD CONSTRAINT "VehicleEvent_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "VehiclePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleEvent" ADD CONSTRAINT "VehicleEvent_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
