-- CreateEnum
CREATE TYPE "ImportListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'FULLY_RESERVED', 'SOLD_OUT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'CONVERTED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "ImportRequest" ADD COLUMN     "listingId" TEXT;

-- CreateTable
CREATE TABLE "Importer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "coverImage" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "city" TEXT,
    "region" TEXT,
    "sourceMarkets" TEXT[],
    "leadTimeDays" INTEGER,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Importer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportListing" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "importerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER,
    "fuelType" "FuelType" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "bodyType" "BodyType" NOT NULL,
    "engineSize" DOUBLE PRECISION,
    "color" TEXT,
    "drivetrain" TEXT,
    "description" TEXT,
    "features" TEXT[],
    "countryOfOrigin" TEXT NOT NULL,
    "portOfLoading" TEXT,
    "auctionSource" TEXT,
    "auctionGrade" TEXT,
    "chassisNumber" TEXT,
    "fobAmount" DECIMAL(14,2) NOT NULL,
    "fobCurrency" TEXT NOT NULL,
    "serviceFeeGhs" DECIMAL(12,2),
    "freightGhs" DECIMAL(12,2),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "etaDays" INTEGER,
    "status" "ImportListingStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportListingImage" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ImportListingImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportReservation" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feeGhs" DECIMAL(12,2) NOT NULL,
    "refundRate" DOUBLE PRECISION NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paidAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "graceApplied" BOOLEAN NOT NULL DEFAULT false,
    "paymentReference" TEXT,
    "refundReference" TEXT,
    "refundedGhs" DECIMAL(12,2),
    "refundedAt" TIMESTAMP(3),
    "importRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Importer_userId_key" ON "Importer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Importer_slug_key" ON "Importer"("slug");

-- CreateIndex
CREATE INDEX "Importer_verified_featured_idx" ON "Importer"("verified", "featured");

-- CreateIndex
CREATE UNIQUE INDEX "ImportListing_slug_key" ON "ImportListing"("slug");

-- CreateIndex
CREATE INDEX "ImportListing_importerId_status_idx" ON "ImportListing"("importerId", "status");

-- CreateIndex
CREATE INDEX "ImportListing_status_featured_idx" ON "ImportListing"("status", "featured");

-- CreateIndex
CREATE INDEX "ImportListing_make_model_year_idx" ON "ImportListing"("make", "model", "year");

-- CreateIndex
CREATE INDEX "ImportListingImage_listingId_position_idx" ON "ImportListingImage"("listingId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ImportReservation_reference_key" ON "ImportReservation"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "ImportReservation_importRequestId_key" ON "ImportReservation"("importRequestId");

-- CreateIndex
CREATE INDEX "ImportReservation_listingId_status_idx" ON "ImportReservation"("listingId", "status");

-- CreateIndex
CREATE INDEX "ImportReservation_userId_status_idx" ON "ImportReservation"("userId", "status");

-- CreateIndex
CREATE INDEX "ImportReservation_status_expiresAt_idx" ON "ImportReservation"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "ImportRequest" ADD CONSTRAINT "ImportRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "ImportListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Importer" ADD CONSTRAINT "Importer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportListing" ADD CONSTRAINT "ImportListing_importerId_fkey" FOREIGN KEY ("importerId") REFERENCES "Importer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportListingImage" ADD CONSTRAINT "ImportListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "ImportListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportReservation" ADD CONSTRAINT "ImportReservation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "ImportListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportReservation" ADD CONSTRAINT "ImportReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportReservation" ADD CONSTRAINT "ImportReservation_importRequestId_fkey" FOREIGN KEY ("importRequestId") REFERENCES "ImportRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
