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

export async function POST(req: Request) {
  const limit = rateLimit(`orders:${getClientId(req)}`, 10, 60_000);
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
      const quantity = Math.max(1, Math.floor(Number(raw.quantity) || 1));
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

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: "PENDING",
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
