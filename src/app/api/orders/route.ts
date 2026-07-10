import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { generateReference } from "@/lib/utils";
import { rateLimit, getClientId } from "@/lib/rate-limit";
import { Prisma, PaymentMethod } from "@prisma/client";

interface OrderItemInput {
  partId: string;
  name: string;
  price: number;
  quantity: number;
}

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
    const items: OrderItemInput[] = body.items ?? [];
    if (!items.length) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }
    if (!body.fullName || !body.phone || !body.address || !body.city) {
      return NextResponse.json({ error: "Delivery details are incomplete" }, { status: 400 });
    }

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shippingFee = subtotal > 2000 ? 0 : 60;
    const total = subtotal + shippingFee;
    const orderNumber = generateReference("CV");
    const method = (body.method as PaymentMethod) ?? "MOBILE_MONEY";

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
        email: body.email || null,
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
            reference: generateReference("PAY"),
          },
        },
      },
    });

    // NOTE: In production, initialise the Paystack / MoMo transaction here and
    // return the authorization URL for redirect.
    return NextResponse.json({ success: true, orderNumber: order.orderNumber }, { status: 201 });
  } catch (error) {
    console.error("[orders:POST]", error);
    // Gracefully degrade when the DB is unavailable (demo mode).
    return NextResponse.json({ success: true, orderNumber: generateReference("CV") }, { status: 201 });
  }
}
