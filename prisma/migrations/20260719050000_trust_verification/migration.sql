-- Trust & verification: dealer KYC submissions + inspection reports. Additive.

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "DealerVerification" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "businessRegNumber" TEXT NOT NULL,
    "taxId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "idType" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "documentUrl" TEXT,
    "notes" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "DealerVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DealerVerification_dealerId_key" ON "DealerVerification"("dealerId");

-- CreateIndex
CREATE INDEX "DealerVerification_status_idx" ON "DealerVerification"("status");

-- AddForeignKey
ALTER TABLE "DealerVerification" ADD CONSTRAINT "DealerVerification_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: inspection report fields
ALTER TABLE "InspectionBooking"
  ADD COLUMN "overallGrade" TEXT,
  ADD COLUMN "reportSummary" TEXT,
  ADD COLUMN "reportUrl" TEXT,
  ADD COLUMN "inspectedAt" TIMESTAMP(3);
