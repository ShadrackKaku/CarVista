import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTransaction } from "@/lib/paystack";
import { confirmMilestonePayment } from "@/lib/escrow";

/**
 * GET /api/payments/escrow/verify?reference=...
 * Confirms an escrow installment after Paystack redirects back. The reference
 * is an unguessable per-installment token, so lookup-by-reference is safe.
 * The webhook is the authoritative confirmation; this is the convenience path.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");
  if (!reference) {
    return NextResponse.json({ error: "Missing payment reference" }, { status: 400 });
  }

  try {
    const milestone = await prisma.escrowMilestone.findUnique({
      where: { reference },
      include: { plan: { select: { importRequestId: true } } },
    });
    if (!milestone) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const importRequestId = milestone.plan.importRequestId;

    // Already confirmed (e.g. by the webhook).
    if (milestone.status === "PAID") {
      return NextResponse.json({ status: "success", label: milestone.label, importRequestId });
    }

    const result = await verifyTransaction(reference);

    if (result.status === "success") {
      await confirmMilestonePayment(milestone.id, result.reference);
      return NextResponse.json({ status: "success", label: milestone.label, importRequestId });
    }

    // Payment failed/abandoned — roll back to LOCKED so it can be retried.
    await prisma.escrowMilestone.updateMany({
      where: { id: milestone.id, status: "PROCESSING" },
      data: { status: "LOCKED" },
    });
    return NextResponse.json({ status: result.status, label: milestone.label, importRequestId });
  } catch (error) {
    console.error("[escrow:verify]", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
