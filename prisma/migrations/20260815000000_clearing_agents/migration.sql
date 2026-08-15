-- AlterEnum
-- Placed before STAFF so the enum reads in the same order as the Prisma schema:
-- the business roles, then the internal ones.
ALTER TYPE "UserRole" ADD VALUE 'CLEARING_AGENT' BEFORE 'STAFF';

-- CreateTable
CREATE TABLE "ClearingAgent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "licenceNumber" TEXT,
    "licenceExpiry" TIMESTAMP(3),
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "city" TEXT,
    "region" TEXT,
    "ports" TEXT[],
    "turnaroundDays" INTEGER,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClearingAgent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClearingAgent_userId_key" ON "ClearingAgent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClearingAgent_slug_key" ON "ClearingAgent"("slug");

-- CreateIndex
CREATE INDEX "ClearingAgent_verified_featured_idx" ON "ClearingAgent"("verified", "featured");

-- AlterTable
ALTER TABLE "ImportRequest" ADD COLUMN     "clearingAgentId" TEXT,
ADD COLUMN     "actualDutyGhs" DECIMAL(12,2),
ADD COLUMN     "customsEntryNumber" TEXT,
ADD COLUMN     "clearedAt" TIMESTAMP(3),
ADD COLUMN     "clearedById" TEXT;

-- CreateIndex
CREATE INDEX "ImportRequest_clearingAgentId_stage_idx" ON "ImportRequest"("clearingAgentId", "stage");

-- AddForeignKey
ALTER TABLE "ClearingAgent" ADD CONSTRAINT "ClearingAgent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRequest" ADD CONSTRAINT "ImportRequest_clearingAgentId_fkey" FOREIGN KEY ("clearingAgentId") REFERENCES "ClearingAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRequest" ADD CONSTRAINT "ImportRequest_clearedById_fkey" FOREIGN KEY ("clearedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
