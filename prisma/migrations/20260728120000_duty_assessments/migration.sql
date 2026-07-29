-- Duty assessments: real ICUMS customs outcomes, the training data for the
-- landed-cost engine. Purely additive.

-- CreateEnum
CREATE TYPE "AssessmentSource" AS ENUM ('PLATFORM_DEAL', 'AGENT', 'COMMUNITY', 'ICUMS_LOOKUP');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "DutyAssessment" (
    "id" TEXT NOT NULL,
    "chassisNumber" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "trimLevel" TEXT,
    "vehicleType" TEXT,
    "engineNo" TEXT,
    "engineSizeCc" INTEGER,
    "yearOfManufacture" INTEGER NOT NULL,
    "originCode" TEXT,
    "color" TEXT,
    "fuelType" TEXT,
    "hsCode" TEXT,
    "hsDescription" TEXT,
    "hdv" DECIMAL(14,2),
    "hdvCurrency" TEXT NOT NULL DEFAULT 'USD',
    "fobNcy" DECIMAL(14,2),
    "cifNcy" DECIMAL(14,2),
    "totalTax" DECIMAL(14,2) NOT NULL,
    "taxLines" JSONB,
    "assessedAt" TIMESTAMP(3),
    "port" TEXT NOT NULL DEFAULT 'Tema',
    "source" "AssessmentSource" NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'PENDING',
    "documentUrls" TEXT[],
    "notes" TEXT,
    "submittedById" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "predictedTotalTax" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DutyAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DutyAssessment_chassisNumber_idx" ON "DutyAssessment"("chassisNumber");

-- CreateIndex
CREATE INDEX "DutyAssessment_make_modelType_yearOfManufacture_idx" ON "DutyAssessment"("make", "modelType", "yearOfManufacture");

-- CreateIndex
CREATE INDEX "DutyAssessment_status_idx" ON "DutyAssessment"("status");

-- AddForeignKey
ALTER TABLE "DutyAssessment" ADD CONSTRAINT "DutyAssessment_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyAssessment" ADD CONSTRAINT "DutyAssessment_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
