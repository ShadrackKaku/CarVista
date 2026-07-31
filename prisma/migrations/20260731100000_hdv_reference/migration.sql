-- HDV reference table (GRA's stable "new value" per vehicle spec) + allow
-- duty assessments captured from the ICUMS results list, which identifies
-- cars by trim/year rather than chassis. Purely additive; the chassis change
-- only relaxes a NOT NULL, so existing rows are unaffected.

-- AlterTable
ALTER TABLE "DutyAssessment" ALTER COLUMN "chassisNumber" DROP NOT NULL;

-- CreateTable
CREATE TABLE "HdvReference" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "trim" TEXT NOT NULL DEFAULT '',
    "icumsMakeCode" TEXT,
    "icumsModelCode" TEXT,
    "hdv" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "hsCode" TEXT,
    "observationCount" INTEGER NOT NULL DEFAULT 1,
    "lastObservedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HdvReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HdvReference_make_model_year_trim_key" ON "HdvReference"("make", "model", "year", "trim");

-- CreateIndex
CREATE INDEX "HdvReference_make_model_year_idx" ON "HdvReference"("make", "model", "year");
