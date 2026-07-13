import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { serviceBookingSchema } from "@/lib/validations";
import { generateReference } from "@/lib/utils";
import { rateLimit, getClientId } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const limit = rateLimit(`booking:${getClientId(req)}`, 10, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Please sign in to book" }, { status: 401 });
  }

  try {
    const parsed = serviceBookingSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid booking" },
        { status: 400 },
      );
    }
    const { serviceProviderId, scheduledAt, vehicleInfo, notes } = parsed.data;

    const provider = await prisma.serviceProvider.findUnique({
      where: { id: serviceProviderId },
      select: { serviceType: true },
    });
    if (!provider) {
      return NextResponse.json({ error: "Service provider not found" }, { status: 404 });
    }

    const booking = await prisma.serviceBooking.create({
      data: {
        bookingNumber: generateReference("BK"),
        userId: user.id,
        serviceProviderId,
        serviceType: provider.serviceType,
        scheduledAt: new Date(scheduledAt),
        vehicleInfo: vehicleInfo || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(
      { success: true, bookingNumber: booking.bookingNumber },
      { status: 201 },
    );
  } catch (error) {
    console.error("[bookings:service]", error);
    return NextResponse.json({ error: "Could not create booking" }, { status: 500 });
  }
}
