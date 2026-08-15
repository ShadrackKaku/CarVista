import type { ImportStage, VehicleCondition, VehicleEventType } from "@prisma/client";

/**
 * Turning a finished import into a vehicle you own.
 *
 * This is the seam the whole platform was missing. Everything up to clearance
 * was built — stock listings, landed-cost estimates, reservations, escrow,
 * tracking — and everything after it was built too, in the marketplace. What
 * did not exist was the step between: the moment a car stops being *an import
 * in progress* and starts being *a car you have*.
 *
 * `ImportRequest.vehicleId` has been in the schema all along, and the admin
 * tracking route already mirrors every stage change onto the vehicle's
 * passport — guarded by `if (request.vehicleId …)`. Nothing ever set it, so
 * that mirror has never once run. Crossing this bridge is what switches it on.
 *
 * The rule that shapes every function here: **nobody re-types a car that is
 * already in the system.** The importer described it once when they listed it;
 * the buyer inherits every field of that description, and the passport inherits
 * the real dates from the shipment that actually happened.
 */

/**
 * Import stage → the passport entry it deserves.
 *
 * Shared rather than local to any one route: the admin tracker, the importer's
 * own stage controls and the backfill below must all agree on what a milestone
 * is called, or the same shipment reads differently depending on who moved it.
 *
 * Not every stage earns an entry. A passport is a record of what happened to
 * the car, not a log of our workflow — `REQUESTED` and `QUOTED` happened to the
 * paperwork, so they are deliberately absent.
 */
export const STAGE_TO_PASSPORT: Partial<
  Record<ImportStage, { type: VehicleEventType; title: string }>
> = {
  PURCHASED: { type: "IMPORTED", title: "Purchased at auction" },
  IN_TRANSIT: { type: "SHIPPED", title: "Shipped — in transit" },
  ARRIVED_AT_PORT: { type: "NOTE", title: "Arrived at port" },
  CUSTOMS_CLEARANCE: { type: "CLEARED", title: "Customs cleared" },
  DELIVERED: { type: "NOTE", title: "Delivered to customer" },
};

/**
 * The stages at which a car may be taken into inventory.
 *
 * Deliberately after customs rather than at arrival. A vehicle sitting at Tema
 * uncleared is not yours to sell — duty is unpaid, it cannot be registered, and
 * a listing for it would be a promise you cannot keep. Clearance is the moment
 * the car becomes property rather than cargo.
 */
export const INVENTORY_READY_STAGES = [
  "READY_FOR_DELIVERY",
  "DELIVERED",
] as const satisfies readonly ImportStage[];

export function canEnterInventory(stage: ImportStage): boolean {
  return (INVENTORY_READY_STAGES as readonly ImportStage[]).includes(stage);
}

/** What to tell someone who asks too early. */
export function inventoryBlockedReason(stage: ImportStage): string | null {
  if (canEnterInventory(stage)) return null;
  if (stage === "CANCELLED") return "This import was cancelled.";
  if (stage === "CUSTOMS_CLEARANCE")
    return "Still with customs. You can add it the moment it clears.";
  return "This car has not cleared customs yet.";
}

/**
 * "2019 Toyota Harrier Premium" — the title a human would have typed.
 *
 * Built from the parts rather than reusing `ImportListing.title`, because that
 * one is sales copy for foreign stock ("2019 Toyota Harrier — Grade 4.5, low
 * mileage, Nagoya") and carries auction detail that means nothing on a Ghanaian
 * marketplace listing. The grade survives on the passport, where it belongs.
 */
export function vehicleTitleFor(input: {
  year: number;
  make: string;
  model: string;
  trim?: string | null;
}): string {
  return [input.year, input.make, input.model, input.trim?.trim() || null]
    .filter(Boolean)
    .join(" ");
}

/**
 * A car that just landed is foreign-used — that is what the phrase means here.
 *
 * It cannot be GHANA_USED: it has never been used in Ghana. The only other
 * honest answer is NEW, and only for genuinely delivery-mileage stock, so the
 * test is tight on both age and odometer. Getting this wrong in the generous
 * direction would let ordinary used imports advertise themselves as new.
 */
export function conditionForImport(input: {
  year: number;
  mileage?: number | null;
  now?: Date;
}): VehicleCondition {
  const currentYear = (input.now ?? new Date()).getFullYear();
  const mileage = input.mileage ?? 0;
  if (mileage <= 100 && input.year >= currentYear - 1) return "NEW";
  return "FOREIGN_USED";
}

export interface TrackingLike {
  stage: ImportStage;
  title: string;
  description?: string | null;
  location?: string | null;
  timestamp: Date;
}

export interface BackfillEvent {
  type: VehicleEventType;
  title: string;
  notes: string | null;
  occurredAt: Date;
}

/**
 * Rebuild the passport from the shipment that already happened.
 *
 * A car crossing this bridge has usually been travelling for weeks and has a
 * tracking history behind it. Writing only a "listed" entry would throw that
 * away and leave the passport claiming the car's life began on the marketplace
 * — which is exactly the unverifiable listing every other site already has.
 *
 * The real dates come across, so the timeline reads as the journey it was.
 *
 * One entry per milestone, earliest wins: a stage often collects several
 * updates ("loaded at Nagoya", "vessel departed"), and the milestone happened
 * at the first of them. The rest stay on the import's own event feed, which is
 * where operational detail belongs.
 */
export function passportBackfill(events: TrackingLike[]): BackfillEvent[] {
  const earliest = new Map<ImportStage, TrackingLike>();

  for (const event of events) {
    if (!STAGE_TO_PASSPORT[event.stage]) continue;
    const held = earliest.get(event.stage);
    if (!held || event.timestamp < held.timestamp) earliest.set(event.stage, event);
  }

  return [...earliest.values()]
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .map((event) => {
      const mapped = STAGE_TO_PASSPORT[event.stage]!;
      // The operator's own words are the useful part; the location grounds it.
      const notes = [event.title, event.location].filter(Boolean).join(" · ");
      return {
        type: mapped.type,
        title: mapped.title,
        notes: notes || null,
        occurredAt: event.timestamp,
      };
    });
}

/**
 * What the car cost to put on Ghanaian soil.
 *
 * Used as the opening price on the draft listing, and shown to the owner as the
 * floor they must clear. We are the only ones who can compute it, because we
 * are the only ones holding the FOB, the freight and the duty for the same
 * car — which is what makes it worth showing.
 *
 * Once an agent has recorded what customs actually charged, that figure
 * replaces the estimate. Anything else would hand a dealer a landed cost that
 * is knowably wrong at the exact moment they are setting a price against it —
 * and being out by the duty variance is the specific mistake this whole chain
 * exists to prevent.
 *
 * `null` when the import never carried a quote, rather than a misleading zero.
 */
export function landedCostOf(input: {
  quotedTotal?: number | null;
  quotedCif?: number | null;
  quotedDuty?: number | null;
  quotedShipping?: number | null;
  /** What customs really charged. Supersedes `quotedDuty` when present. */
  actualDuty?: number | null;
}): number | null {
  const actual = typeof input.actualDuty === "number" && input.actualDuty > 0 ? input.actualDuty : null;

  if (input.quotedTotal && input.quotedTotal > 0) {
    // Swap the estimate out of the total rather than recomputing from parts,
    // because the total may carry fees the individual lines do not.
    if (actual != null && input.quotedDuty && input.quotedDuty > 0) {
      return input.quotedTotal - input.quotedDuty + actual;
    }
    return input.quotedTotal;
  }

  const duty = actual ?? input.quotedDuty;
  const parts = [input.quotedCif, duty, input.quotedShipping].filter(
    (n): n is number => typeof n === "number" && n > 0,
  );
  if (!parts.length) return null;
  return parts.reduce((sum, n) => sum + n, 0);
}
