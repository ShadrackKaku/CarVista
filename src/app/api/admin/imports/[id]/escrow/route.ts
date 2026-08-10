import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-guard";
import { escrowPlanSchema, escrowPlanActionSchema } from "@/lib/validations";
import { buildMilestonesFromTemplate } from "@/lib/escrow";

/**
 * POST — create (or replace a DRAFT) escrow plan for an import request.
 * PATCH — activate / cancel / reopen the plan.
 * Admin only. All amounts are recomputed and validated server-side.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const guard = await requirePermission("escrow:manage");
  if (guard.error) return guard.error;

  try {
    const request = await prisma.importRequest.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true, escrowPlan: { select: { id: true, status: true } } },
    });
    if (!request) {
      return NextResponse.json({ error: "Import request not found" }, { status: 404 });
    }

    // A plan that already has payments (ACTIVE with paid milestones / COMPLETED)
    // must not be silently rebuilt. Only a DRAFT can be replaced.
    if (request.escrowPlan && request.escrowPlan.status !== "DRAFT") {
      return NextResponse.json(
        { error: "A plan already exists. Cancel it before creating a new one." },
        { status: 409 },
      );
    }

    const parsed = escrowPlanSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid plan" },
        { status: 400 },
      );
    }
    const { totalAmount, useTemplate, milestones } = parsed.data;

    // Build the installments — either from the 20/30/30/20 template or the
    // explicit list, whose amounts must sum to the total (within 1 cedi).
    const rows = useTemplate
      ? buildMilestonesFromTemplate(totalAmount)
      : (milestones ?? []).map((m, i) => ({
          label: m.label,
          description: m.description ?? "",
          amount: Math.round(m.amount),
          unlockStage: m.unlockStage,
          sequence: i,
        }));

    const sum = rows.reduce((s, r) => s + r.amount, 0);
    if (Math.abs(sum - Math.round(totalAmount)) > 1) {
      return NextResponse.json(
        { error: `Installments (${sum}) must add up to the total (${Math.round(totalAmount)}).` },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      if (request.escrowPlan) {
        await tx.escrowPlan.delete({ where: { id: request.escrowPlan.id } });
      }
      await tx.escrowPlan.create({
        data: {
          importRequestId: request.id,
          userId: request.userId,
          totalAmount: Math.round(totalAmount),
          status: "DRAFT",
          milestones: {
            create: rows.map((r) => ({
              sequence: r.sequence,
              label: r.label,
              description: r.description || null,
              amount: r.amount,
              unlockStage: r.unlockStage,
            })),
          },
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin:escrow:POST]", error);
    return NextResponse.json({ error: "Could not create the plan" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requirePermission("escrow:manage");
  if (guard.error) return guard.error;

  try {
    const parsed = escrowPlanActionSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const plan = await prisma.escrowPlan.findUnique({
      where: { importRequestId: params.id },
      include: { milestones: { select: { status: true } } },
    });
    if (!plan) return NextResponse.json({ error: "No plan to update" }, { status: 404 });

    const hasPaid = plan.milestones.some((m) => m.status === "PAID");

    let status: "DRAFT" | "ACTIVE" | "CANCELLED";
    if (parsed.data.action === "activate") {
      status = "ACTIVE";
    } else if (parsed.data.action === "cancel") {
      status = "CANCELLED";
    } else {
      // reopen → back to DRAFT for reconfiguration, but never once money's in.
      if (hasPaid) {
        return NextResponse.json(
          { error: "Can't reopen — an installment has already been paid." },
          { status: 409 },
        );
      }
      status = "DRAFT";
    }

    await prisma.escrowPlan.update({ where: { id: plan.id }, data: { status } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin:escrow:PATCH]", error);
    return NextResponse.json({ error: "Could not update the plan" }, { status: 500 });
  }
}
