-- Suppliers: the wholesale side of the marketplace.
--
-- Shaped like Dealer and PartsStore on purpose. The marketplace renders all
-- three through the same card and profile components, and a fourth shape would
-- have meant a fourth set of them.

CREATE TYPE "SupplierCategory" AS ENUM ('VEHICLES', 'PARTS', 'TYRES', 'LUBRICANTS', 'ACCESSORIES', 'EQUIPMENT');
CREATE TYPE "EnquiryStatus" AS ENUM ('OPEN', 'QUOTED', 'CLOSED', 'DECLINED');

CREATE TABLE "Supplier" (
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
    "address" TEXT,
    "city" TEXT,
    "region" TEXT,
    "categories" "SupplierCategory"[],
    "minimumOrder" TEXT,
    "servesRegions" TEXT[],
    "leadTimeDays" INTEGER,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Supplier_userId_key" ON "Supplier"("userId");
CREATE UNIQUE INDEX "Supplier_slug_key" ON "Supplier"("slug");
CREATE INDEX "Supplier_verified_featured_idx" ON "Supplier"("verified", "featured");
CREATE INDEX "Supplier_city_idx" ON "Supplier"("city");

CREATE TABLE "SupplierEnquiry" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "category" "SupplierCategory",
    "item" TEXT NOT NULL,
    "quantity" TEXT,
    "message" TEXT,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'OPEN',
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierEnquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupplierEnquiry_supplierId_status_idx" ON "SupplierEnquiry"("supplierId", "status");
CREATE INDEX "SupplierEnquiry_buyerId_idx" ON "SupplierEnquiry"("buyerId");

ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupplierEnquiry" ADD CONSTRAINT "SupplierEnquiry_supplierId_fkey"
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupplierEnquiry" ADD CONSTRAINT "SupplierEnquiry_buyerId_fkey"
    FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
