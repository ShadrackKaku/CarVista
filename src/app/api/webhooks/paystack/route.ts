import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, settledAsExpected, isPaystackConfigured } from "@/lib/paystack";
import { confirmPaidPayment } from "@/lib/fulfill-order";
import { confirmMilestonePayment } from "@/lib/escrow";

/**
 * POST /api/webhooks/paystack
 * Server-to-server confirmation from Paystack. This is the authoritative
 * source of truth for payment success (the redirect verify is a convenience).
 *
 * Configure this URL in Paystack: Settings → API Keys & Webhooks → Webhook URL:
 *   https://YOUR_DOMAIN/api/webhooks/paystack
 */
export async function POST(req: Request) {
  // Without the secret we can't authenticate the payload — reject rather than
  // let the signature check throw a 500.
  if (!isPaystackConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 401 });
  }

  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    event?: string;
    data?: { reference?: string; amount?: number; currency?: string };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    if (event.event === "charge.success" && event.data?.reference) {
      const ref = event.data.reference;
      // The payload is signature-verified, so its amount/currency are
      // authoritative. Still confirm they match what we expect before
      // fulfilling — a mismatch means don't touch the record.
      const settled = {
        amount: Number(event.data.amount ?? 0),
        currency: String(event.data.currency ?? "GHS"),
      };

      // Escrow installment references are prefixed "ESC-"; everything else is a
      // shop order. Reconcile whichever this reference belongs to.
      const payment = await prisma.payment.findUnique({
        where: { reference: ref },
        select: { id: true, amount: true, currency: true },
      });
      if (payment) {
        if (settledAsExpected(settled, Number(payment.amount), payment.currency)) {
          await confirmPaidPayment(payment.id, ref);
        } else {
          console.error("[paystack:webhook] order amount mismatch", { ref });
        }
      } else {
        const milestone = await prisma.escrowMilestone.findUnique({
          where: { reference: ref },
          select: { id: true, amount: true, plan: { select: { currency: true } } },
        });
        if (milestone) {
          if (settledAsExpected(settled, Number(milestone.amount), milestone.plan.currency)) {
            await confirmMilestonePayment(milestone.id, ref);
          } else {
            console.error("[paystack:webhook] escrow amount mismatch", { ref });
          }
        }
      }
    }
  } catch (error) {
    console.error("[paystack:webhook]", error);
    // Return 200 so Paystack doesn't retry indefinitely on our internal errors;
    // the redirect verify path will reconcile.
  }

  return NextResponse.json({ received: true });
}
