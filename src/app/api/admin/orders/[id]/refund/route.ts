import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-guard";
import { isPaystackConfigured } from "@/lib/paystack";
import { initiateOrderRefund } from "@/lib/fulfill-order";

/**
 * POST — refund a paid parts order. Admin only. The amount is read from the
 * database and the money goes back to whoever paid it (via Paystack). The
 * webhook finalizes it and restocks the items.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requirePermission("escrow:manage");
  if (guard.error) return guard.error;

  if (!isPaystackConfigured()) {
    return NextResponse.json({ error: "Refunds aren't available right now." }, { status: 503 });
  }

  const result = await initiateOrderRefund(params.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }
  return NextResponse.json({ success: true });
}
