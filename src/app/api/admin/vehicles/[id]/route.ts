import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-guard";
import { addVehicleEvent } from "@/lib/passport";

/**
 * PATCH — approve or reject a vehicle listing.
 * Body: { action: "approve" | "reject" }
 *   approve → status ACTIVE + verified
 *   reject  → status REJECTED
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requirePermission("listings:moderate");
  if (guard.error) return guard.error;

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === "approve") {
      await prisma.vehicle.update({
        where: { id: params.id },
        data: { status: "ACTIVE", verified: true },
      });
      // Record the verification on the vehicle's passport (feeds the trust graph).
      await addVehicleEvent({
        vehicleId: params.id,
        type: "INSPECTED",
        title: "Verified & approved by CarVista",
        occurredAt: new Date(),
        verified: true,
        source: "admin",
        recordedById: guard.user.id,
      });
    } else if (action === "reject") {
      await prisma.vehicle.update({
        where: { id: params.id },
        data: { status: "REJECTED", verified: false },
      });
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[admin:vehicles:PATCH]", e);
    return NextResponse.json({ error: "Could not update listing" }, { status: 500 });
  }
}
