import { prisma } from "@/lib/prisma";
import { refundTransaction } from "@/lib/paystack";
import { refundDue } from "@/lib/reservations";
import { syncListingAvailability } from "@/lib/reserve-fee";

export interface ExpirySweep {
  examined: number;
  expired: number;
  refunded: number;
  refundFailures: number;
  /** Refunds that failed on an earlier sweep and were retried on this one. */
  retried: number;
}

/**
 * Release holds whose window has closed, and refund the agreed share.
 *
 * Two properties matter more than anything else here, because this job moves
 * money outward on a schedule with nobody watching.
 *
 * It must not refund twice. Cron jobs get retried, overlap, and occasionally
 * run twice from two regions. Every step is therefore conditional on the state
 * it expects to find: the status flips only `WHERE status = 'ACTIVE'`, and the
 * refund is only attempted `WHERE refundReference IS NULL`. A second run
 * matches nothing and pays nobody.
 *
 * It must not lose a unit. The hold is released — and the listing's
 * availability recomputed — before the refund is attempted, so a Paystack
 * outage returns the car to the market even if the money is delayed. Holding
 * the unit hostage to a payment provider punishes the importer for our problem.
 *
 * That split creates a third obligation: a refund that failed must still get
 * paid. An expired row is no longer ACTIVE, so the first pass will never look
 * at it again — the second pass exists precisely to sweep up money the first
 * pass owed and could not send. Without it, a provider outage at the wrong
 * minute keeps a customer's cedis permanently.
 */
export async function expireLapsedReservations(now: Date = new Date()): Promise<ExpirySweep> {
  const due = await prisma.importReservation.findMany({
    where: { status: "ACTIVE", expiresAt: { lte: now } },
    select: {
      id: true,
      reference: true,
      feeGhs: true,
      refundRate: true,
      paymentReference: true,
      refundReference: true,
    },
    // Oldest deadline first, so a partial run always clears the most overdue.
    orderBy: { expiresAt: "asc" },
    take: 200,
  });

  const sweep: ExpirySweep = {
    examined: due.length,
    expired: 0,
    refunded: 0,
    refundFailures: 0,
    retried: 0,
  };

  // Rows this run has already attempted. The second pass is for *earlier*
  // sweeps' failures — retrying a refund the provider rejected seconds ago just
  // doubles the calls and the log noise while it is down.
  const handled = new Set<string>();

  for (const reservation of due) {
    // Conditional: if another run already expired this one, count() is 0 and
    // we do not touch it again.
    const flipped = await prisma.importReservation.updateMany({
      where: { id: reservation.id, status: "ACTIVE" },
      data: { status: "EXPIRED" },
    });
    if (flipped.count === 0) continue;
    sweep.expired += 1;

    // Unit back on the market first — before any money moves.
    await syncListingAvailability(reservation.id);

    handled.add(reservation.id);
    await settleRefund(reservation, sweep);
  }

  // ── second pass: money the first pass owed and could not send ──
  const owed = await prisma.importReservation.findMany({
    where: { status: "EXPIRED", refundReference: null, paymentReference: { not: null } },
    select: {
      id: true,
      reference: true,
      feeGhs: true,
      refundRate: true,
      paymentReference: true,
      refundReference: true,
    },
    orderBy: { expiresAt: "asc" },
    take: 200,
  });

  for (const reservation of owed) {
    if (handled.has(reservation.id)) continue;
    const before = sweep.refunded;
    await settleRefund(reservation, sweep);
    if (sweep.refunded > before) sweep.retried += 1;
  }

  return sweep;
}

type Refundable = {
  id: string;
  reference: string;
  feeGhs: unknown;
  refundRate: number;
  paymentReference: string | null;
  refundReference: string | null;
};

/**
 * Send the share this hold is owed, once.
 *
 * The recorded `refundReference` is the idempotency guard, so it is written
 * immediately and conditionally on still being empty — two sweeps racing on the
 * same row cannot both pay out.
 */
async function settleRefund(reservation: Refundable, sweep: ExpirySweep): Promise<boolean> {
  const amount = refundDue(Number(reservation.feeGhs), reservation.refundRate);
  if (amount <= 0 || !reservation.paymentReference || reservation.refundReference) return false;

  try {
    const refund = await refundTransaction(reservation.paymentReference, amount);
    const recorded = await prisma.importReservation.updateMany({
      where: { id: reservation.id, refundReference: null },
      data: {
        refundReference: refund.reference ?? reservation.paymentReference,
        refundedGhs: amount,
        refundedAt: new Date(),
      },
    });
    if (recorded.count > 0) {
      sweep.refunded += 1;
      return true;
    }
    return false;
  } catch (error) {
    // Left unrefunded on purpose — the second pass will find it next run.
    // Swallowing the error and writing a reference would quietly keep the
    // customer's money and no sweep would ever look at it again.
    sweep.refundFailures += 1;
    console.error("[reservations:refund]", reservation.reference, error);
    return false;
  }
}
