-- Order refunds + checkout idempotency. Purely additive.
-- (RefundStatus enum already exists from the escrow-refunds migration.)

-- AlterTable: Payment refund tracking
ALTER TABLE "Payment"
  ADD COLUMN "refundStatus" "RefundStatus" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "refundedAt" TIMESTAMP(3);

-- AlterTable: Order idempotency key
ALTER TABLE "Order" ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
