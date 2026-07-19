import { prisma } from "@/lib/prisma";
import { sendMail, orderConfirmationEmail } from "@/lib/email";
import { refundTransaction } from "@/lib/paystack";
import { absoluteUrl } from "@/lib/utils";

/**
 * Atomically marks a payment SUCCESS and its order PAID **exactly once**, then
 * emails the customer a confirmation. Safe to call from both the redirect-verify
 * path and the webhook — the conditional `updateMany` guarantees only the first
 * caller performs the transition (and therefore only one email is sent).
 */
export async function confirmPaidPayment(paymentId: string, providerRef?: string): Promise<void> {
  const transition = await prisma.payment.updateMany({
    where: { id: paymentId, status: { not: "SUCCESS" } },
    data: { status: "SUCCESS", paidAt: new Date(), providerRef: providerRef ?? undefined },
  });

  // Already confirmed by the other path — nothing more to do.
  if (transition.count === 0) return;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: { include: { items: true } } },
  });
  if (!payment) return;

  await prisma.order.update({ where: { id: payment.orderId }, data: { status: "PAID" } });

  // Decrement inventory now that the order is paid. This runs exactly once
  // because the payment→SUCCESS transition above is the single gate. Each
  // decrement is atomic and guarded (`stock >= quantity`) so stock can never go
  // negative even if two orders race for the last unit; if the guard fails the
  // item was oversold — clamp to zero and flag it for manual fulfilment rather
  // than silently shipping stock we don't have.
  for (const item of payment.order.items) {
    const applied = await prisma.part.updateMany({
      where: { id: item.partId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });
    if (applied.count === 0) {
      await prisma.part.updateMany({ where: { id: item.partId }, data: { stock: 0 } });
      console.warn("[fulfill] oversold item", {
        orderId: payment.orderId,
        partId: item.partId,
        wanted: item.quantity,
      });
    }
  }

  const order = payment.order;
  if (order.email) {
    await sendMail({
      to: order.email,
      subject: `Your CarVista order ${order.orderNumber} is confirmed`,
      html: orderConfirmationEmail({
        name: order.fullName,
        orderNumber: order.orderNumber,
        total: Number(order.total),
        items: order.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: Number(i.price),
        })),
        ordersUrl: absoluteUrl("/dashboard/orders"),
      }),
    }).catch((e) => console.error("[order-confirmation-email]", e));
  }
}

/**
 * Whether a paid parts order can be refunded: its payment must be SUCCESS and
 * not already in a refund flow. Pure — shared by the UI and the endpoint.
 */
export function isOrderRefundable(payment: {
  status: string;
  refundStatus: string;
}): boolean {
  return payment.status === "SUCCESS" && payment.refundStatus === "NONE";
}

/**
 * Kick off a refund for a paid parts order. Marks the payment PENDING refund
 * (claimed atomically so two admins can't double-refund), reads the amount from
 * the database, and calls Paystack. Settlement is finalized by the webhook.
 */
export async function initiateOrderRefund(
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string; status?: number }> {
  const payment = await prisma.payment.findUnique({
    where: { orderId },
    select: { id: true, status: true, refundStatus: true, reference: true, amount: true },
  });
  if (!payment) return { ok: false, error: "No payment for this order", status: 404 };
  if (!isOrderRefundable(payment)) {
    return { ok: false, error: "This order can't be refunded.", status: 409 };
  }

  const claim = await prisma.payment.updateMany({
    where: { id: payment.id, refundStatus: "NONE", status: "SUCCESS" },
    data: { refundStatus: "PENDING" },
  });
  if (claim.count === 0) return { ok: false, error: "A refund is already in progress.", status: 409 };

  try {
    await refundTransaction(payment.reference, Number(payment.amount));
    return { ok: true };
  } catch (e) {
    await prisma.payment.updateMany({
      where: { id: payment.id, refundStatus: "PENDING" },
      data: { refundStatus: "NONE" },
    });
    console.error("[order:refund:initiate]", e);
    return { ok: false, error: "Could not start the refund. Try again.", status: 502 };
  }
}

/**
 * Idempotently record a parts-order refund outcome (from the Paystack webhook),
 * keyed by the original transaction reference. On success it marks the payment
 * and order REFUNDED, RESTOCKS the items, and notifies the buyer.
 */
export async function settleOrderRefund(
  reference: string,
  outcome: "REFUNDED" | "FAILED",
): Promise<void> {
  const transition = await prisma.payment.updateMany({
    where: { reference, refundStatus: { in: ["PENDING", "NONE"] } },
    data: {
      refundStatus: outcome,
      ...(outcome === "REFUNDED" ? { status: "REFUNDED", refundedAt: new Date() } : {}),
    },
  });
  if (transition.count === 0 || outcome !== "REFUNDED") return;

  const payment = await prisma.payment.findUnique({
    where: { reference },
    include: { order: { include: { items: true } } },
  });
  if (!payment) return;

  await prisma.order.update({ where: { id: payment.orderId }, data: { status: "REFUNDED" } });

  // Return the refunded items to stock.
  for (const item of payment.order.items) {
    await prisma.part.updateMany({
      where: { id: item.partId },
      data: { stock: { increment: item.quantity } },
    });
  }

  await prisma.notification
    .create({
      data: {
        userId: payment.order.userId,
        type: "ORDER",
        title: `Order ${payment.order.orderNumber}: refund processed`,
        body: "Your payment has been refunded. Allow a few days for it to reflect.",
        link: `/dashboard/orders`,
      },
    })
    .catch(() => null);
}
