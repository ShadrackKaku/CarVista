import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-guard";
import { addVehicleEvent } from "@/lib/passport";
import { importTrackingUpdateSchema, importQuoteSchema } from "@/lib/validations";
import type { ImportStage, VehicleEventType } from "@prisma/client";

// When an import reaches a real-world milestone and it's tied to a listed
// vehicle, mirror the milestone onto that vehicle's Passport (the trust graph).
const STAGE_TO_PASSPORT: Partial<Record<ImportStage, { type: VehicleEventType; title: string }>> = {
  PURCHASED: { type: "IMPORTED", title: "Purchased at auction" },
  IN_TRANSIT: { type: "SHIPPED", title: "Shipped — in transit" },
  ARRIVED_AT_PORT: { type: "NOTE", title: "Arrived at port" },
  CUSTOMS_CLEARANCE: { type: "CLEARED", title: "Customs cleared" },
  DELIVERED: { type: "NOTE", title: "Delivered to customer" },
};

/**
 * PATCH — advance an import request.
 *   action "update": add a tracking event + move the stage (mirrors to Passport)
 *   action "quote":  save the landed-cost quote
 * Admin only.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requirePermission("imports:manage");
  if (guard.error) return guard.error;

  try {
    const body = await req.json().catch(() => ({}));

    const request = await prisma.importRequest.findUnique({
      where: { id: params.id },
      select: { id: true, vehicleId: true, userId: true, requestNumber: true },
    });
    if (!request) {
      return NextResponse.json({ error: "Import request not found" }, { status: 404 });
    }

    // ── Save quote ──────────────────────────────────────────────
    if (body.action === "quote") {
      const parsed = importQuoteSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.errors[0]?.message ?? "Invalid quote" },
          { status: 400 },
        );
      }
      await prisma.importRequest.update({
        where: { id: request.id },
        data: {
          quotedCif: parsed.data.quotedCif,
          quotedDuty: parsed.data.quotedDuty,
          quotedShipping: parsed.data.quotedShipping,
          quotedTotal: parsed.data.quotedTotal,
        },
      });
      return NextResponse.json({ success: true });
    }

    // ── Add a tracking update (default action) ──────────────────
    const parsed = importTrackingUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid update" },
        { status: 400 },
      );
    }
    const { stage, title, description, location, estimatedArrival, trackingNumber } = parsed.data;

    const eta = estimatedArrival ? new Date(estimatedArrival) : undefined;

    await prisma.$transaction([
      prisma.importTrackingEvent.create({
        data: {
          importRequestId: request.id,
          stage,
          title,
          description: description || null,
          location: location || null,
        },
      }),
      prisma.importRequest.update({
        where: { id: request.id },
        data: {
          stage,
          ...(trackingNumber ? { trackingNumber } : {}),
          ...(eta && !Number.isNaN(eta.getTime()) ? { estimatedArrival: eta } : {}),
        },
      }),
    ]);

    // Mirror the milestone onto the linked vehicle's Passport.
    const passportEvent = STAGE_TO_PASSPORT[stage as ImportStage];
    if (request.vehicleId && passportEvent) {
      await addVehicleEvent({
        vehicleId: request.vehicleId,
        type: passportEvent.type,
        title: passportEvent.title,
        notes: location ? `${title} · ${location}` : title,
        verified: true,
        source: "import",
        recordedById: guard.user.id,
      });
    }

    // Let the customer know their import moved.
    await prisma.notification
      .create({
        data: {
          userId: request.userId,
          type: "IMPORT",
          title: `Import ${request.requestNumber}: ${title}`,
          body: description || null,
          link: `/dashboard/imports`,
        },
      })
      .catch(() => null);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin:imports:PATCH]", error);
    return NextResponse.json({ error: "Could not update the import" }, { status: 500 });
  }
}
