import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { dealerBulkSchema } from "@/lib/validations";
import { BULK_ACTION_STATUS } from "@/lib/dealer-actions";

/**
 * PATCH — apply a bulk status change to the dealer's OWN listings.
 * Ownership is enforced in the query (`sellerId = user.id`), so a dealer can
 * never affect another seller's vehicles even by passing foreign ids.
 */
export async function PATCH(req: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  try {
    const parsed = dealerBulkSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const status = BULK_ACTION_STATUS[parsed.data.action];
    const result = await prisma.vehicle.updateMany({
      where: { id: { in: parsed.data.ids }, sellerId: user.id },
      data: { status },
    });

    return NextResponse.json({ success: true, updated: result.count });
  } catch (error) {
    console.error("[dealer:listings:bulk]", error);
    return NextResponse.json({ error: "Could not update the listings" }, { status: 500 });
  }
}
