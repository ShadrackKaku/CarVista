import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { rateLimit, getClientId } from "@/lib/rate-limit";
import { escrowPaySchema } from "@/lib/validations";
import { isMilestonePayable, escrowReference } from "@/lib/escrow";
import { initializeTransaction, isPaystackConfigured } from "@/lib/paystack";
import { absoluteUrl } from "@/lib/utils";

/**
 * POST — start payment for one escrow installment.
 *
 * The buyer may only pay their own import, only when the plan is ACTIVE, and
 * only for an installment the import has actually unlocked. The amount is read
 * from the database (never trusted from the client), and payment goes through
 * Paystack's hosted checkout (cards + Mobile Money) — funds settle to the
 * merchant account, nothing is held in custody.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const limit = rateLimit(`escrow-pay:${getClientId(req)}`, 10, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  if (!isPaystackConfigured()) {
    return NextResponse.json(
      { error: "Online payments aren't available right now. Please contact your agent." },
      { status: 503 },
    );
  }

  try {
    const parsed = escrowPaySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Load the import (owner-scoped), its stage, plan and the target milestone.
    const importReq = await prisma.importRequest.findFirst({
      where: { id: params.id, userId: user.id },
      select: {
        id: true,
        requestNumber: true,
        stage: true,
        user: { select: { email: true } },
        escrowPlan: {
          select: {
            id: true,
            status: true,
            currency: true,
            milestones: {
              where: { id: parsed.data.milestoneId },
              select: { id: true, label: true, amount: true, status: true, unlockStage: true },
            },
          },
        },
      },
    });

    if (!importReq) return NextResponse.json({ error: "Import not found" }, { status: 404 });
    const plan = importReq.escrowPlan;
    const milestone = plan?.milestones[0];
    if (!plan || !milestone) {
      return NextResponse.json({ error: "Installment not found" }, { status: 404 });
    }

    // Server-side payability check — the single source of truth.
    if (!isMilestonePayable(milestone, importReq.stage, plan.status)) {
      return NextResponse.json(
        { error: "This installment isn't payable yet." },
        { status: 409 },
      );
    }

    const email = user.email ?? importReq.user?.email;
    if (!email) {
      return NextResponse.json({ error: "No email on file for payment." }, { status: 400 });
    }

    const reference = escrowReference(milestone.id);
    const amount = Number(milestone.amount);

    const init = await initializeTransaction({
      email,
      amountGhs: amount,
      reference,
      currency: (plan.currency as "GHS") ?? "GHS",
      callbackUrl: absoluteUrl(`/import/escrow/verify?reference=${reference}`),
      metadata: {
        kind: "escrow",
        importRequestId: importReq.id,
        milestoneId: milestone.id,
        label: milestone.label,
      },
    });

    // Record that a payment is in flight (overwrites any abandoned attempt).
    await prisma.escrowMilestone.update({
      where: { id: milestone.id },
      data: { status: "PROCESSING", method: "PAYSTACK", reference, providerRef: null },
    });

    return NextResponse.json({ authorizationUrl: init.authorizationUrl, reference });
  } catch (error) {
    console.error("[escrow:pay]", error);
    return NextResponse.json({ error: "Could not start payment" }, { status: 500 });
  }
}
