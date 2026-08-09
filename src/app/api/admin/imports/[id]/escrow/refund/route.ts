import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-guard";
import { isPaystackConfigured } from "@/lib/paystack";
import { initiateMilestoneRefund } from "@/lib/escrow";
import { escrowPaySchema } from "@/lib/validations";

/**
 * POST — refund a paid escrow installment. Admin only.
 * The milestone must belong to this import's plan. The refund amount is read
 * from the database and the money goes back to whoever paid it (via Paystack).
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const guard = await requirePermission("escrow:manage");
  if (guard.error) return guard.error;

  if (!isPaystackConfigured()) {
    return NextResponse.json({ error: "Refunds aren't available right now." }, { status: 503 });
  }

  try {
    const parsed = escrowPaySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Ensure the milestone really belongs to THIS import's plan before refunding.
    const milestone = await prisma.escrowMilestone.findFirst({
      where: { id: parsed.data.milestoneId, plan: { importRequestId: params.id } },
      select: { id: true },
    });
    if (!milestone) {
      return NextResponse.json({ error: "Installment not found" }, { status: 404 });
    }

    const result = await initiateMilestoneRefund(milestone.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin:escrow:refund]", error);
    return NextResponse.json({ error: "Could not process the refund" }, { status: 500 });
  }
}
