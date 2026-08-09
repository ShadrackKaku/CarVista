import crypto from "node:crypto";
import { RESERVATION_WORKING_DAYS, addGhanaWorkingDays } from "./ghana-calendar";

/**
 * Reservation terms and the arithmetic behind them.
 *
 * A buyer pays a fee to hold one unit of a listing while they arrange the FOB
 * transfer. Pay inside the window and the whole fee comes off the FOB; miss it
 * and a share comes back.
 *
 * The two constants below are *today's* terms. They are copied onto each
 * reservation when it is taken and read back from the row afterwards — never
 * from here. A reservation settles on the terms its buyer agreed to, so
 * changing the price or the refund share must not reach backwards into holds
 * that are already running.
 */
export const RESERVATION_FEE_GHS = 500;

/** Share refunded when the window closes without the FOB. */
export const RESERVATION_REFUND_RATE = 0.5;

/** Statuses that hold a unit off the market. */
export const HOLDING_STATUSES = ["ACTIVE"] as const;

export type ReservationStatusLike =
  | "PENDING_PAYMENT"
  | "ACTIVE"
  | "CONVERTED"
  | "EXPIRED"
  | "CANCELLED";

/**
 * Whether a reservation is currently holding a unit.
 *
 * `PENDING_PAYMENT` deliberately does not: an abandoned checkout would
 * otherwise lock a car nobody paid for, and a listing could be starved by
 * anyone willing to click Reserve repeatedly.
 *
 * `CONVERTED` does not either — the unit has left the pool for good by then,
 * which the importer reflects by decrementing quantity when the car is bought.
 *
 * A hold past its deadline stops counting immediately, before any sweep has
 * run. Status alone would mean a car stays off the market until the next cron
 * fires — an hour, or a day on a plan that only allows daily crons — for a
 * hold that everyone can already see has lapsed. The sweep still does the
 * durable work of flipping the row and refunding; it just no longer stands
 * between a lapsed hold and the next buyer.
 */
export function isHolding(
  status: ReservationStatusLike,
  expiresAt?: Date | null,
  now: Date = new Date(),
): boolean {
  if (status !== "ACTIVE") return false;
  return !hasExpired(expiresAt ?? null, now);
}

/**
 * Prisma `where` matching exactly the reservations that hold a unit.
 *
 * Shared by every place that counts availability so the browse page, the
 * detail page, the importer's console and the reserve endpoint cannot drift
 * apart on what "held" means — a disagreement that shows up as a car the buyer
 * is told is free and then refused at the point of paying.
 */
export function holdingWhere(now: Date = new Date()) {
  return { status: "ACTIVE" as const, expiresAt: { gt: now } };
}

/** Units still open to reserve. Never negative, whatever the data says. */
export function unitsAvailable(quantity: number, holdingCount: number): number {
  return Math.max(0, Math.floor(quantity) - Math.max(0, Math.floor(holdingCount)));
}

export interface ReservationWindow {
  expiresAt: Date;
  graceApplied: boolean;
  /** Named holidays inside the window, so the customer can be told why. */
  skipped: string[];
}

/**
 * When a hold that was paid for at `paidAt` runs out.
 *
 * Measured from the moment the money cleared, not from when the buyer opened
 * the checkout — an unpaid reservation holds nothing, so its clock has nothing
 * to run.
 */
export function reservationWindow(
  paidAt: Date,
  workingDays: number = RESERVATION_WORKING_DAYS,
): ReservationWindow {
  const { date, skipped, graceApplied } = addGhanaWorkingDays(paidAt, workingDays);
  return { expiresAt: date, graceApplied, skipped: skipped.map((h) => h.name) };
}

/** Whether an active hold has run out, as of `now`. */
export function hasExpired(expiresAt: Date | null, now: Date = new Date()): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() <= now.getTime();
}

/**
 * What comes back when a hold lapses.
 *
 * Rounded down to the pesewa. Rounding up would have us refund a fraction of a
 * pesewa more than was taken, which Paystack rejects on a partial refund.
 */
export function refundDue(feeGhs: number, refundRate: number): number {
  if (!Number.isFinite(feeGhs) || feeGhs <= 0) return 0;
  const rate = Math.min(Math.max(refundRate, 0), 1);
  return Math.floor(feeGhs * rate * 100) / 100;
}

/** What the fee is worth against the FOB when the buyer completes in time. */
export function creditTowardFob(feeGhs: number): number {
  return Math.max(0, feeGhs);
}

export type ReservationBlock =
  | "not-active"
  | "sold-out"
  | "already-holding"
  | null;

/**
 * Why this buyer cannot take a unit right now, or null if they can.
 *
 * `already-holding` stops one account quietly holding several units of the same
 * listing — the fee is small enough that a competitor could otherwise freeze an
 * importer's whole run for two days.
 */
export function reservationBlock(input: {
  listingStatus: string;
  quantity: number;
  holdingCount: number;
  buyerAlreadyHolds: boolean;
}): ReservationBlock {
  if (input.buyerAlreadyHolds) return "already-holding";
  if (input.listingStatus !== "ACTIVE") return "not-active";
  if (unitsAvailable(input.quantity, input.holdingCount) < 1) return "sold-out";
  return null;
}

export const RESERVATION_BLOCK_MESSAGES: Record<NonNullable<ReservationBlock>, string> = {
  "not-active": "This listing isn't open for reservations right now.",
  "sold-out": "Every unit of this listing is currently reserved. Check back — holds expire.",
  "already-holding": "You already have a hold on this listing.",
};

/** Reference for the fee payment. Random, not sequential — see escrow.ts. */
export function reservationReference(): string {
  return `RSV-${crypto.randomBytes(5).toString("hex")}`.toUpperCase();
}
