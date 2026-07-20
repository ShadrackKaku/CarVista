import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { generateReference } from "@/lib/utils";
import { rateLimit, getClientId } from "@/lib/rate-limit";
import { initializeTransaction, isPaystackConfigured } from "@/lib/paystack";
import { Prisma, PaymentMethod } from "@prisma/client";

interface OrderItemInput {
  partId: string;
  quantity: number;
}

// Paystack's hosted checkout covers cards AND Mobile Money in Ghana.
const PAYSTACK_METHODS: PaymentMethod[] = ["PAYSTACK", "MOBILE_MONEY"];

/**
 * Build the checkout response for an order that ALREADY exists (an idempotent
 * replay of a double-submitted checkout). If it's still awaiting an online
 * payment, re-initialize Paystack with the SAME reference — Paystack returns
 * the same transaction, so the customer lands on the identical hosted checkout
 * rather than a duplicate charge.
 */
async function existingOrderResponse(
  order: {
    orderNumber: string;
    userId: string;
    email: string | null;
    status: string;
    total: Prisma.Decimal;
    payment: { method: PaymentMethod; reference: string; status: string } | null;
  },
  req: Request,
): Promise<NextResponse> {
  const p = order.payment;
  if (
    p &&
    PAYSTACK_METHODS.includes(p.method) &&
    isPaystackConfigured() &&
    order.email &&
    order.status === "PENDING" &&
    p.status === "PENDING"
  ) {
    try {
      const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
      const init = await initializeTransaction({
        email: order.email,
        amountGhs: Number(order.total),
        reference: p.reference,
        callbackUrl: `${origin}/checkout/verify`,
        metadata: { orderNumber: order.orderNumber, userId: order.userId },
      });
      return NextResponse.json(
        { success: true, orderNumber: order.orderNumber, authorizationUrl: init.authorizationUrl, idempotent: true },
        { status: 200 },
      );
    } catch {
      // fall through to the pending response
    }
  }
  return NextResponse.json(
    { success: true, orderNumber: order.orderNumber, paymentPending: true, idempotent: true },
    { status: 200 },
  );
}

export async function POST(req: Request) {
  const limit = await rateLimit(`orders:${getClientId(req)}`, 10, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Please sign in to place an order" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const rawItems: OrderItemInput[] = body.items ?? [];
    if (!rawItems.length) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }
    if (!body.fullName || !body.phone || !body.address || !body.city) {
      return NextResponse.json({ error: "Delivery details are incomplete" }, { status: 400 });
    }

    // Idempotency: if this checkout was already submitted (same key, same user),
    // return the existing order instead of creating a duplicate.
    const idempotencyKey =
      typeof body.idempotencyKey === "string" && body.idempotencyKey.length <= 100
        ? body.idempotencyKey
        : null;
    if (idempotencyKey) {
      const existing = await prisma.order.findUnique({
        where: { idempotencyKey },
        include: { payment: { select: { method: true, reference: true, status: true } } },
      });
      if (existing && existing.userId === user.id) {
        return existingOrderResponse(existing, req);
      }
    }

    // ── Server-side validation: NEVER trust client-supplied prices/names. ──
    // Re-fetch every part from the database and use its authoritative price.
    const partIds = [...new Set(rawItems.map((i) => i.partId))];
    const dbParts = await prisma.part.findMany({
      where: { id: { in: partIds }, status: "ACTIVE" },
      select: { id: true, name: true, price: true, discountPrice: true, stock: true },
    });
    const partMap = new Map(dbParts.map((p) => [p.id, p]));

    const items: { partId: string; name: string; price: number; quantity: number }[] = [];
    for (const raw of rawItems) {
      const part = partMap.get(raw.partId);
      if (!part) {
        return NextResponse.json(
          { error: "One or more items are no longer available. Please review your cart." },
          { status: 400 },
        );
      }
      const quantity = Math.min(999, Math.max(1, Math.floor(Number(raw.quantity) || 1)));
      if (part.stock < quantity) {
        return NextResponse.json(
          { error: `Only ${part.stock} left of "${part.name}". Please adjust the quantity.` },
          { status: 409 },
        );
      }
      items.push({
        partId: part.id,
        name: part.name,
        price: Number(part.discountPrice ?? part.price),
        quantity,
      });
    }

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shippingFee = subtotal > 2000 ? 0 : 60;
    const total = subtotal + shippingFee;
    const orderNumber = generateReference("CV");
    const paymentReference = generateReference("PAY");
    const method = (body.method as PaymentMethod) ?? "MOBILE_MONEY";
    const email = body.email || user.email;

    let order;
    try {
      order = await prisma.order.create({
        data: {
          orderNumber,
          userId: user.id,
          status: "PENDING",
          idempotencyKey,
          subtotal: new Prisma.Decimal(subtotal),
          shippingFee: new Prisma.Decimal(shippingFee),
          total: new Prisma.Decimal(total),
          fullName: body.fullName,
          phone: body.phone,
          email: email || null,
          address: body.address,
          city: body.city,
          region: body.region ?? "Greater Accra",
          notes: body.notes || null,
          items: {
            create: items.map((i) => ({
              partId: i.partId,
              name: i.name,
              price: new Prisma.Decimal(i.price),
              quantity: i.quantity,
            })),
          },
          payment: {
            create: {
              method,
              status: "PENDING",
              amount: new Prisma.Decimal(total),
              reference: paymentReference,
            },
          },
        },
      });
    } catch (e) {
      // Concurrent double-submit: the other request won the unique idempotency
      // key. Return that order instead of erroring or duplicating.
      if (
        idempotencyKey &&
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        const existing = await prisma.order.findUnique({
          where: { idempotencyKey },
          include: { payment: { select: { method: true, reference: true, status: true } } },
        });
        if (existing) return existingOrderResponse(existing, req);
      }
      throw e;
    }

    // Online payment via Paystack (card + Mobile Money).
    if (PAYSTACK_METHODS.includes(method) && isPaystackConfigured() && email) {
      try {
        const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
        const init = await initializeTransaction({
          email,
          amountGhs: total,
          reference: paymentReference,
          callbackUrl: `${origin}/checkout/verify`,
          metadata: { orderNumber, userId: user.id },
        });
        return NextResponse.json(
          { success: true, orderNumber, authorizationUrl: init.authorizationUrl },
          { status: 201 },
        );
      } catch (err) {
        console.error("[orders:paystack-init]", err);
        return NextResponse.json(
          {
            success: true,
            orderNumber,
            paymentPending: true,
            message: "Order placed. We'll contact you to complete payment.",
          },
          { status: 201 },
        );
      }
    }

    return NextResponse.json(
      { success: true, orderNumber: order.orderNumber, paymentPending: true },
      { status: 201 },
    );
  } catch (error) {
    console.error("[orders:POST]", error);
    return NextResponse.json(
      { error: "Could not place your order. Please try again." },
      { status: 500 },
    );
  }
}
