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
