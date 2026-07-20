import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { vehicleEventSchema } from "@/lib/validations";
import { addVehicleEvent } from "@/lib/passport";
import { rateLimit, getClientId } from "@/lib/rate-limit";
import type { VehicleEventType } from "@prisma/client";

/**
 * POST — append an event to a vehicle's passport.
 *
 * Only the vehicle's owner (seller) or an admin may add events. Admin-added
 * events are marked verified; a seller's own entries are unverified until
 * reviewed. This is the write path into the trust timeline.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const limit = await rateLimit(`passport:${getClientId(req)}`, 30, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  }

  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
      select: { id: true, sellerId: true },
    });
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const isAdmin = user.role === "ADMIN";
    const isOwner = vehicle.sellerId === user.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Not allowed for this vehicle" }, { status: 403 });
    }

    const parsed = vehicleEventSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid event" },
        { status: 400 },
      );
    }
    const { type, title, notes, occurredAt } = parsed.data;

    const when = occurredAt ? new Date(occurredAt) : new Date();
    const ok = await addVehicleEvent({
      vehicleId: vehicle.id,
      type: type as VehicleEventType,
      title,
      notes: notes ?? null,
      occurredAt: Number.isNaN(when.getTime()) ? new Date() : when,
      // Only an admin can vouch for an event's authenticity.
      verified: isAdmin,
      source: isAdmin ? "admin" : "dealer",
      recordedById: user.id,
    });

    if (!ok) {
      return NextResponse.json({ error: "Could not record the event" }, { status: 500 });
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[vehicle-events:POST]", error);
    return NextResponse.json({ error: "Could not record the event" }, { status: 500 });
  }
}
