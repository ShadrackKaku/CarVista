import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { rateLimit, getClientId } from "@/lib/rate-limit";
import { initializeTransaction, isPaystackConfigured } from "@/lib/paystack";
import { absoluteUrl } from "@/lib/utils";
import {
  RESERVATION_BLOCK_MESSAGES,
  RESERVATION_FEE_GHS,
  RESERVATION_REFUND_RATE,
  holdingWhere,
  reservationBlock,
  reservationReference,
  type ReservationBlock,
} from "@/lib/reservations";

/** Narrowed so the message lookup below cannot be handed a null key. */
type ReserveFailure = "not-found" | NonNullable<ReservationBlock>;

/**
 * POST — start a reservation on one unit of an import listing.
 *
 * Two things make this harder than it looks.
 *
 * The first is overselling. A listing has a finite number of units, and the
 * check "is one free?" and the act of taking it must not be separable — two
 * buyers hitting the last unit a millisecond apart would both read `1
 * available` and both succeed, and an importer would owe a car they do not
 * have. The count and the insert therefore share one SERIALIZABLE transaction:
 * Postgres tracks the read-write dependency between them and aborts the loser
 * with 40001, which surfaces to that buyer as "already reserved" rather than as
 * a car they will never receive.
 *
 * The second is that a row created here holds nothing. It is PENDING_PAYMENT
 * until the fee actually clears, because an abandoned Paystack checkout must
 * not lock a unit — otherwise anyone could freeze an importer's whole run for
 * free by opening checkout and walking away. The clock starts in the webhook.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const limit = await rateLimit(`reserve:${getClientId(req)}`, 8, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  if (!isPaystackConfigured()) {
    return NextResponse.json(
      { error: "Online payments aren't available right now. Please contact us." },
      { status: 503 },
    );
  }

  if (!user.email) {
    return NextResponse.json({ error: "No email on file for payment." }, { status: 400 });
  }

  const reference = reservationReference();
  // One clock for the whole transaction. Re-reading the time inside would let
  // a hold count as live in the availability check and lapsed a millisecond
  // later, which is exactly the ambiguity the SERIALIZABLE block exists to end.
  const now = new Date();

  try {
    const created = await prisma.$transaction(
      async (tx) => {
        const listing = await tx.importListing.findUnique({
          where: { id: params.id },
          select: { id: true, status: true, quantity: true, title: true, importerId: true },
        });
        if (!listing) return { ok: false as const, error: "not-found" as ReserveFailure };

        // Both counts are inside the transaction on purpose — reading them
        // outside would reintroduce the race this whole block exists to close.
        const [holdingCount, mine] = await Promise.all([
          tx.importReservation.count({
            where: { listingId: listing.id, ...holdingWhere(now) },
          }),
          tx.importReservation.count({
            where: { listingId: listing.id, userId: user.id, status: { in: ["ACTIVE", "PENDING_PAYMENT"] } },
          }),
        ]);

        const block = reservationBlock({
          listingStatus: listing.status,
          quantity: listing.quantity,
          holdingCount,
          buyerAlreadyHolds: mine > 0,
        });
        if (block) return { ok: false as const, error: block as ReserveFailure };

        const reservation = await tx.importReservation.create({
          data: {
            reference,
            listingId: listing.id,
            userId: user.id,
            // Today's terms, copied onto the row. Everything downstream — the
            // refund, the credit against the FOB, what the buyer is shown —
            // reads them from here, so changing the policy later cannot reach
            // backwards into a hold someone has already agreed to.
            feeGhs: new Prisma.Decimal(RESERVATION_FEE_GHS),
            refundRate: RESERVATION_REFUND_RATE,
            status: "PENDING_PAYMENT",
            paymentReference: reference,
          },
          select: { id: true, reference: true },
        });

        return { ok: true as const, reservation, listing };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (!created.ok) {
      if (created.error === "not-found") {
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: RESERVATION_BLOCK_MESSAGES[created.error] },
        { status: 409 },
      );
    }

    const init = await initializeTransaction({
      email: user.email,
      amountGhs: RESERVATION_FEE_GHS,
      reference: created.reservation.reference,
      currency: "GHS",
      callbackUrl: absoluteUrl(`/app/imports/reservations?reference=${created.reservation.reference}`),
      metadata: {
        kind: "import-reservation",
        reservationId: created.reservation.id,
        listingId: created.listing.id,
        listingTitle: created.listing.title,
      },
    });

    return NextResponse.json({
      authorizationUrl: init.authorizationUrl,
      reference: created.reservation.reference,
      feeGhs: RESERVATION_FEE_GHS,
    });
  } catch (error) {
    // 40001 is Postgres giving up on one of two transactions that raced for the
    // same unit. The loser has not reserved anything, and telling them the unit
    // went is the truth.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" || error.meta?.code === "40001")
    ) {
      return NextResponse.json(
        { error: "Someone reserved that unit a moment before you. Try another." },
        { status: 409 },
      );
    }
    console.error("[import-listings:reserve]", error);
    return NextResponse.json({ error: "Could not start the reservation" }, { status: 500 });
  }
}
