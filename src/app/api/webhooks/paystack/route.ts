import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/paystack";

/**
 * POST /api/webhooks/paystack
 * Server-to-server confirmation from Paystack. This is the authoritative
 * source of truth for payment success (the redirect verify is a convenience).
 *
 * Configure this URL in Paystack: Settings → API Keys & Webhooks → Webhook URL:
 *   https://YOUR_DOMAIN/api/webhooks/paystack
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    if (event.event === "charge.success" && event.data?.reference) {
      const payment = await prisma.payment.findUnique({
        where: { reference: event.data.reference },
      });
      if (payment && payment.status !== "SUCCESS") {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: "SUCCESS", paidAt: new Date(), providerRef: event.data.reference },
          }),
          prisma.order.update({ where: { id: payment.orderId }, data: { status: "PAID" } }),
        ]);
      }
    }
  } catch (error) {
    console.error("[paystack:webhook]", error);
    // Return 200 so Paystack doesn't retry indefinitely on our internal errors;
    // the redirect verify path will reconcile.
  }

  return NextResponse.json({ received: true });
}
