import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { inspectionBookingSchema } from "@/lib/validations";
import { generateReference } from "@/lib/utils";
import { rateLimit, getClientId } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const limit = rateLimit(`inspection:${getClientId(req)}`, 10, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Please sign in to book an inspection" }, { status: 401 });
  }

  try {
    const parsed = inspectionBookingSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid booking" },
        { status: 400 },
      );
    }
    const { vehicleInfo, location, scheduledAt, notes } = parsed.data;

    const booking = await prisma.inspectionBooking.create({
      data: {
        bookingNumber: generateReference("INS"),
        userId: user.id,
        vehicleInfo,
        location,
        scheduledAt: new Date(scheduledAt),
        notes: notes || null,
      },
    });

    return NextResponse.json(
      { success: true, bookingNumber: booking.bookingNumber },
      { status: 201 },
    );
  } catch (error) {
    console.error("[bookings:inspection]", error);
    return NextResponse.json({ error: "Could not create booking" }, { status: 500 });
  }
}
