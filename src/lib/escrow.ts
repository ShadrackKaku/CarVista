/**
 * Milestone escrow — buyer protection for car imports.
 *
 * This is a NON-CUSTODIAL, milestone-protected installment model. The buyer
 * pays each installment directly through Paystack (which settles into the
 * merchant account); the platform never holds a third-party balance, so it stays
 * out of regulated fund-custody territory. An installment only becomes
 * *payable* once ops verifies the matching real-world import stage — so a
 * customer never pays for a step that hasn't happened.
 *
 * Everything money-related here is recomputed on the server: amounts come from
 * the database, never from the client, and the PAID transition is idempotent.
 */
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { refundTransaction } from "@/lib/paystack";
import type { ImportStage, PaymentMethod } from "@prisma/client";

/**
 * Canonical workflow order of import stages. Used to decide whether an import
 * has reached (or passed) the stage that unlocks a milestone. CANCELLED sits
 * outside the flow.
 */
export const STAGE_RANK: Record<ImportStage, number> = {
  REQUESTED: 0,
  QUOTED: 1,
  VEHICLE_SELECTED: 2,
  PURCHASED: 3,
  SHIPPING_PENDING: 4,
  IN_TRANSIT: 5,
  ARRIVED_AT_PORT: 6,
  CUSTOMS_CLEARANCE: 7,
  READY_FOR_DELIVERY: 8,
  DELIVERED: 9,
  CANCELLED: -1,
};

export interface MilestoneTemplateEntry {
  label: string;
  description: string;
  /** Share of the total, 0–1. The four entries sum to 1. */
  percent: number;
  unlockStage: ImportStage;
}

/**
 * The default 20 / 30 / 30 / 20 split. Each installment is tied to a verifiable
 * import milestone, so the buyer always pays *after* real progress.
 */
export const DEFAULT_MILESTONE_TEMPLATE: MilestoneTemplateEntry[] = [
  {
    label: "Deposit",
    description: "Secures your slot so we can start sourcing your vehicle.",
    percent: 0.2,
    unlockStage: "REQUESTED",
  },
  {
    label: "Vehicle purchased",
    description: "Due once we've won and paid for your car at auction.",
    percent: 0.3,
    unlockStage: "PURCHASED",
  },
  {
    label: "Shipping & customs",
    description: "Covers freight and duty once the car clears the port.",
    percent: 0.3,
    unlockStage: "CUSTOMS_CLEARANCE",
  },
  {
    label: "Final balance",
    description: "The last installment, just before we hand over the keys.",
    percent: 0.2,
    unlockStage: "READY_FOR_DELIVERY",
  },
];

/**
 * Split a total into whole-cedi installments using the default template. Any
 * rounding remainder is folded into the final installment so the parts always
 * sum back to the exact total.
 */
export function buildMilestonesFromTemplate(
  total: number,
): { label: string; description: string; amount: number; unlockStage: ImportStage; sequence: number }[] {
  const rows = DEFAULT_MILESTONE_TEMPLATE.map((t, i) => ({
    label: t.label,
    description: t.description,
    unlockStage: t.unlockStage,
    sequence: i,
    amount: Math.round(total * t.percent),
  }));
  const allocated = rows.reduce((s, r) => s + r.amount, 0);
  const last = rows[rows.length - 1];
  if (last) last.amount += total - allocated; // absorb the rounding remainder
  return rows;
}

/**
 * Whether a given milestone can be paid right now: the plan must be ACTIVE,
 * the installment not already paid, and the import must have reached the
 * milestone's unlock stage. Pure — the single source of truth for payability,
 * used by both the UI and the pay endpoint (so authorization can't drift).
 */
export function isMilestonePayable(
  milestone: { status: string; unlockStage: ImportStage },
  currentStage: ImportStage,
  planStatus: string,
): boolean {
  if (planStatus !== "ACTIVE") return false;
  if (milestone.status === "PAID") return false;
  if (currentStage === "CANCELLED") return false;
  return STAGE_RANK[currentStage] >= STAGE_RANK[milestone.unlockStage];
}

/** A unique, human-recognizable Paystack reference for an escrow installment. */
export function escrowReference(milestoneId: string): string {
  return `ESC-${milestoneId.slice(-6)}-${crypto.randomBytes(4).toString("hex")}`.toUpperCase();
}

/**
 * Idempotently mark a milestone PAID **exactly once**, then advance the plan to
 * COMPLETED if it was the last one and notify the buyer. Safe to call from both
 * the redirect-verify path and the webhook — the conditional `updateMany`
 * guarantees only the first caller performs the transition.
 */
export async function confirmMilestonePayment(
  milestoneId: string,
  providerRef?: string,
): Promise<void> {
  const transition = await prisma.escrowMilestone.updateMany({
    where: { id: milestoneId, status: { not: "PAID" } },
    data: { status: "PAID", paidAt: new Date(), providerRef: providerRef ?? undefined },
  });

  // Already confirmed by the other path — nothing more to do.
  if (transition.count === 0) return;

  const milestone = await prisma.escrowMilestone.findUnique({
    where: { id: milestoneId },
    include: {
      plan: {
        include: {
          milestones: { select: { status: true } },
          importRequest: { select: { requestNumber: true, userId: true } },
        },
      },
    },
  });
  if (!milestone) return;

  const plan = milestone.plan;
  const allPaid = plan.milestones.every((m) => m.status === "PAID");
  if (allPaid && plan.status !== "COMPLETED") {
    await prisma.escrowPlan.update({ where: { id: plan.id }, data: { status: "COMPLETED" } });
  }

  await prisma.notification
    .create({
      data: {
        userId: plan.userId,
        type: "IMPORT",
        title: allPaid
          ? `Import ${plan.importRequest.requestNumber}: fully paid 🎉`
          : `Import ${plan.importRequest.requestNumber}: installment received`,
        body: allPaid
          ? "Every installment is settled. We'll be in touch about handover."
          : `We've received your "${milestone.label}" payment. Thank you!`,
        link: `/dashboard/imports/${plan.importRequestId}`,
      },
    })
    .catch(() => null);
}

/**
 * Whether an installment is eligible to be refunded: it must be PAID and not
 * already in a refund flow. Pure — used by both the admin UI and the refund
 * endpoint so the rule can't drift.
 */
export function isMilestoneRefundable(milestone: {
  status: string;
  refundStatus: string;
}): boolean {
  return milestone.status === "PAID" && milestone.refundStatus === "NONE";
}

/**
 * Kick off a refund for a paid installment. Marks it PENDING and calls Paystack
 * (which settles refunds asynchronously — the webhook flips it to REFUNDED).
 * The PENDING flag is set with a conditional `updateMany` so two admins can't
 * both trigger a refund. Amount is read from the database, never the client.
 */
export async function initiateMilestoneRefund(
  milestoneId: string,
): Promise<{ ok: true } | { ok: false; error: string; status?: number }> {
  const milestone = await prisma.escrowMilestone.findUnique({
    where: { id: milestoneId },
    select: { id: true, status: true, refundStatus: true, reference: true, amount: true },
  });
  if (!milestone) return { ok: false, error: "Installment not found", status: 404 };
  if (!isMilestoneRefundable(milestone)) {
    return { ok: false, error: "This installment can't be refunded.", status: 409 };
  }
  if (!milestone.reference) {
    return { ok: false, error: "No payment reference to refund.", status: 409 };
  }

  // Claim the refund atomically — only the first caller proceeds.
  const claim = await prisma.escrowMilestone.updateMany({
    where: { id: milestone.id, refundStatus: "NONE", status: "PAID" },
    data: { refundStatus: "PENDING" },
  });
  if (claim.count === 0) {
    return { ok: false, error: "A refund is already in progress.", status: 409 };
  }

  try {
    await refundTransaction(milestone.reference, Number(milestone.amount));
    return { ok: true };
  } catch (e) {
    // Roll the claim back so it can be retried.
    await prisma.escrowMilestone.updateMany({
      where: { id: milestone.id, refundStatus: "PENDING" },
      data: { refundStatus: "NONE" },
    });
    console.error("[escrow:refund:initiate]", e);
    return { ok: false, error: "Could not start the refund. Try again.", status: 502 };
  }
}

/**
 * Idempotently record the outcome of a refund (from the Paystack webhook),
 * keyed by the ORIGINAL transaction reference, and notify the buyer on success.
 */
export async function settleMilestoneRefund(
  originalReference: string,
  outcome: "REFUNDED" | "FAILED",
): Promise<void> {
  const transition = await prisma.escrowMilestone.updateMany({
    where: { reference: originalReference, refundStatus: { in: ["PENDING", "NONE"] } },
    data: {
      refundStatus: outcome,
      ...(outcome === "REFUNDED" ? { refundedAt: new Date() } : {}),
    },
  });
  if (transition.count === 0 || outcome !== "REFUNDED") return;

  const milestone = await prisma.escrowMilestone.findUnique({
    where: { reference: originalReference },
    include: { plan: { select: { userId: true, importRequestId: true, importRequest: { select: { requestNumber: true } } } } },
  });
  if (!milestone) return;

  await prisma.notification
    .create({
      data: {
        userId: milestone.plan.userId,
        type: "IMPORT",
        title: `Import ${milestone.plan.importRequest.requestNumber}: refund processed`,
        body: `Your "${milestone.label}" installment has been refunded.`,
        link: `/dashboard/imports/${milestone.plan.importRequestId}`,
      },
    })
    .catch(() => null);
}

export type { PaymentMethod };
