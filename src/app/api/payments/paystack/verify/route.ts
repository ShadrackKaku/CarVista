import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTransaction, settledAsExpected } from "@/lib/paystack";
import { confirmPaidPayment } from "@/lib/fulfill-order";

/**
 * GET /api/payments/paystack/verify?reference=...
 * Verifies a Paystack transaction and marks the order/payment as paid.
 * Called from the /checkout/verify page after Paystack redirects back.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");
  if (!reference) {
    return NextResponse.json({ error: "Missing payment reference" }, { status: 400 });
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: { order: true },
    });
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Already confirmed (e.g. by the webhook) — return current state.
    if (payment.status === "SUCCESS") {
      return NextResponse.json({ status: "success", orderNumber: payment.order.orderNumber });
    }

    const result = await verifyTransaction(reference);

    if (result.status === "success") {
      // Payment-integrity guard: only fulfil if Paystack settled the exact
      // amount and currency the order expects.
      if (!settledAsExpected(result, Number(payment.amount), payment.currency)) {
        console.error("[paystack:verify] amount/currency mismatch", {
          reference,
          expected: Number(payment.amount),
          currency: payment.currency,
          gotPesewas: result.amount,
          gotCurrency: result.currency,
        });
        return NextResponse.json(
          { status: "mismatch", orderNumber: payment.order.orderNumber },
          { status: 409 },
        );
      }
      await confirmPaidPayment(payment.id, result.reference);
      return NextResponse.json({ status: "success", orderNumber: payment.order.orderNumber });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: result.status === "failed" ? "FAILED" : "PENDING" },
    });
    return NextResponse.json({
      status: result.status,
      orderNumber: payment.order.orderNumber,
    });
  } catch (error) {
    console.error("[paystack:verify]", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
