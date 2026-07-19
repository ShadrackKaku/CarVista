-- Escrow refunds: track money-back on paid installments when a plan is
-- cancelled. Purely additive — a new enum + two nullable/defaulted columns.

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('NONE', 'PENDING', 'REFUNDED', 'FAILED');

-- AlterTable
ALTER TABLE "EscrowMilestone"
  ADD COLUMN "refundStatus" "RefundStatus" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "refundedAt" TIMESTAMP(3);
