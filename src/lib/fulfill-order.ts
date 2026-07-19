import { prisma } from "@/lib/prisma";
import { sendMail, orderConfirmationEmail } from "@/lib/email";
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
