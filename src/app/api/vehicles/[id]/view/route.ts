import { NextResponse } from "next/server";
import { incrementVehicleViews } from "@/lib/queries";

/**
 * POST /api/vehicles/[id]/view — record a listing view.
 *
 * Fired by a small client beacon (once per session per listing), so it counts
 * real page loads even though the detail page itself is ISR-cached. Best-effort:
 * a failure never blocks anything.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  await incrementVehicleViews(params.id).catch(() => {});
  return NextResponse.json({ ok: true });
}
