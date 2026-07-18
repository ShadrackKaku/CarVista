-- Milestone escrow: a non-custodial, milestone-protected installment plan for
-- car imports. Buyers pay each installment through Paystack only after ops
-- verifies the matching import stage. Purely additive — new enums/tables only.

-- CreateEnum
CREATE TYPE "EscrowPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EscrowMilestoneStatus" AS ENUM ('LOCKED', 'PROCESSING', 'PAID');

-- CreateTable
CREATE TABLE "EscrowPlan" (
    "id" TEXT NOT NULL,
    "importRequestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "status" "EscrowPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscrowPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowMilestone" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "unlockStage" "ImportStage" NOT NULL,
    "status" "EscrowMilestoneStatus" NOT NULL DEFAULT 'LOCKED',
    "method" "PaymentMethod",
    "reference" TEXT,
    "providerRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscrowMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EscrowPlan_importRequestId_key" ON "EscrowPlan"("importRequestId");

-- CreateIndex
CREATE INDEX "EscrowPlan_userId_idx" ON "EscrowPlan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowMilestone_reference_key" ON "EscrowMilestone"("reference");

-- CreateIndex
CREATE INDEX "EscrowMilestone_planId_idx" ON "EscrowMilestone"("planId");

-- AddForeignKey
ALTER TABLE "EscrowPlan" ADD CONSTRAINT "EscrowPlan_importRequestId_fkey" FOREIGN KEY ("importRequestId") REFERENCES "ImportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowPlan" ADD CONSTRAINT "EscrowPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowMilestone" ADD CONSTRAINT "EscrowMilestone_planId_fkey" FOREIGN KEY ("planId") REFERENCES "EscrowPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
