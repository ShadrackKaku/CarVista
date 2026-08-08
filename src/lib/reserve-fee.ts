import { prisma } from "@/lib/prisma";
import { RESERVATION_WORKING_DAYS, addGhanaWorkingDays } from "@/lib/ghana-calendar";

/**
 * Turn a paid reservation fee into a live hold.
 *
 * This is the moment a unit actually comes off the market, and the moment the
 * two-working-day clock starts — measured from now, not from when the buyer
 * opened checkout, because until the money cleared they were holding nothing.
 *
 * Idempotent. Paystack retries webhooks, and a second delivery must not extend
 * a deadline the buyer has already been given: the update is conditional on the
 * row still being PENDING_PAYMENT, so a replay matches nothing and changes
 * nothing.
 */
export async function confirmReservationFee(
  reservationId: string,
  providerReference: string,
): Promise<boolean> {
  const paidAt = new Date();
  const { date: expiresAt, graceApplied } = addGhanaWorkingDays(
    paidAt,
    RESERVATION_WORKING_DAYS,
  );

  const result = await prisma.importReservation.updateMany({
    where: { id: reservationId, status: "PENDING_PAYMENT" },
    data: {
      status: "ACTIVE",
      paidAt,
      expiresAt,
      graceApplied,
      paymentReference: providerReference,
    },
  });

  if (result.count === 0) return false;

  // Reflect the hold on the listing so browse surfaces stop offering a unit
  // that is gone. Recomputed from the live count rather than decremented, so a
  // missed webhook cannot leave the flag permanently wrong.
  await syncListingAvailability(reservationId);
  return true;
}

/**
 * Recompute a listing's status from what is actually held.
 *
 * Derived, never incremented or decremented. A counter drifts the first time an
 * expiry job dies halfway; a count cannot.
 */
export async function syncListingAvailability(reservationId: string): Promise<void> {
  const reservation = await prisma.importReservation.findUnique({
    where: { id: reservationId },
    select: { listingId: true },
  });
  if (!reservation) return;

  const listing = await prisma.importListing.findUnique({
    where: { id: reservation.listingId },
    select: { id: true, quantity: true, status: true },
  });
  if (!listing) return;

  // DRAFT and ARCHIVED are the importer's decisions and are left alone; only
  // the availability-driven pair flips automatically.
  if (listing.status !== "ACTIVE" && listing.status !== "FULLY_RESERVED") return;

  const holding = await prisma.importReservation.count({
    where: { listingId: listing.id, status: "ACTIVE" },
  });
  const next = holding >= listing.quantity ? "FULLY_RESERVED" : "ACTIVE";
  if (next !== listing.status) {
    await prisma.importListing.update({ where: { id: listing.id }, data: { status: next } });
  }
}
