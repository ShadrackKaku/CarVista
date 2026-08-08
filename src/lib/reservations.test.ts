import { describe, it, expect } from "vitest";
import {
  RESERVATION_FEE_GHS,
  RESERVATION_REFUND_RATE,
  creditTowardFob,
  hasExpired,
  isHolding,
  refundDue,
  reservationBlock,
  reservationReference,
  reservationWindow,
  unitsAvailable,
} from "./reservations";

const at = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe("what holds a unit", () => {
  it("counts only an active hold", () => {
    expect(isHolding("ACTIVE")).toBe(true);
    // The one that matters: an abandoned checkout must not lock a car. If
    // PENDING_PAYMENT held a unit, anyone could freeze a listing for free by
    // clicking Reserve and walking away.
    expect(isHolding("PENDING_PAYMENT")).toBe(false);
    expect(isHolding("EXPIRED")).toBe(false);
    expect(isHolding("CANCELLED")).toBe(false);
    expect(isHolding("CONVERTED")).toBe(false);
  });
});

describe("unitsAvailable", () => {
  it("subtracts holds from stock", () => {
    expect(unitsAvailable(5, 2)).toBe(3);
    expect(unitsAvailable(1, 0)).toBe(1);
    expect(unitsAvailable(1, 1)).toBe(0);
  });

  it("never goes negative, whatever the data says", () => {
    // Bad data must read as "sold out", not as negative stock that would let
    // the guard below wave a reservation through.
    expect(unitsAvailable(2, 5)).toBe(0);
    expect(unitsAvailable(-3, 0)).toBe(0);
  });
});

describe("reservationBlock", () => {
  const base = { listingStatus: "ACTIVE", quantity: 3, holdingCount: 1, buyerAlreadyHolds: false };

  it("lets a buyer take an available unit", () => {
    expect(reservationBlock(base)).toBeNull();
  });

  it("refuses when every unit is held", () => {
    expect(reservationBlock({ ...base, holdingCount: 3 })).toBe("sold-out");
    expect(reservationBlock({ ...base, holdingCount: 9 })).toBe("sold-out");
  });

  it("refuses a listing that isn't open", () => {
    for (const status of ["DRAFT", "ARCHIVED", "SOLD_OUT", "FULLY_RESERVED"]) {
      expect(reservationBlock({ ...base, listingStatus: status })).toBe("not-active");
    }
  });

  it("stops one account holding several units of the same listing", () => {
    // The fee is small enough that a competitor could otherwise freeze an
    // importer's entire run for two working days.
    expect(reservationBlock({ ...base, buyerAlreadyHolds: true })).toBe("already-holding");
  });

  it("checks the buyer's own hold before anything else", () => {
    // Even on a sold-out listing, telling them "you already hold one" is the
    // truer answer than "sold out".
    expect(
      reservationBlock({ ...base, holdingCount: 3, buyerAlreadyHolds: true }),
    ).toBe("already-holding");
  });
});

describe("reservationWindow", () => {
  it("runs two Ghana working days from when the money cleared", () => {
    const w = reservationWindow(at("2026-08-10")); // Monday
    expect(w.expiresAt.toISOString().slice(0, 10)).toBe("2026-08-12");
    expect(w.graceApplied).toBe(false);
  });

  it("carries the reason when a holiday pushed it out", () => {
    const w = reservationWindow(at("2026-03-04"));
    expect(w.expiresAt.toISOString().slice(0, 10)).toBe("2026-03-09");
    expect(w.skipped).toContain("Independence Day");
  });
});

describe("hasExpired", () => {
  it("expires at the deadline, not after it", () => {
    const deadline = at("2026-08-12");
    expect(hasExpired(deadline, deadline)).toBe(true);
    expect(hasExpired(deadline, new Date(deadline.getTime() - 1))).toBe(false);
    expect(hasExpired(deadline, new Date(deadline.getTime() + 1))).toBe(true);
  });

  it("treats a hold with no deadline as still running", () => {
    // A PENDING_PAYMENT row has no expiry yet. Reading that as "expired" would
    // have the cron cancel reservations that were about to be paid for.
    expect(hasExpired(null)).toBe(false);
  });
});

describe("the money", () => {
  it("credits the whole fee toward the FOB when the buyer completes", () => {
    expect(creditTowardFob(RESERVATION_FEE_GHS)).toBe(500);
  });

  it("returns half when the window closes without payment", () => {
    expect(refundDue(500, RESERVATION_REFUND_RATE)).toBe(250);
  });

  it("uses the rate the reservation was taken under, not today's", () => {
    // The whole reason the rate lives on the row: a policy change must not
    // reach backwards into a hold someone already agreed to.
    expect(refundDue(500, 0.3)).toBe(150);
    expect(refundDue(750, 0.5)).toBe(375);
  });

  it("rounds down to the pesewa", () => {
    // Paystack rejects a partial refund larger than the original in minor
    // units, so rounding up is the direction that actually breaks.
    expect(refundDue(333.33, 0.5)).toBe(166.66);
    expect(refundDue(0.01, 0.5)).toBe(0);
  });

  it("refuses to invent money from junk input", () => {
    expect(refundDue(0, 0.5)).toBe(0);
    expect(refundDue(-500, 0.5)).toBe(0);
    expect(refundDue(NaN, 0.5)).toBe(0);
    // A rate outside 0–1 is clamped rather than refunding more than was taken.
    expect(refundDue(500, 2)).toBe(500);
    expect(refundDue(500, -1)).toBe(0);
  });

  it("ships the terms the product actually promises", () => {
    expect(RESERVATION_FEE_GHS).toBe(500);
    expect(RESERVATION_REFUND_RATE).toBe(0.5);
  });
});

describe("reservationReference", () => {
  it("is unguessable and unique", () => {
    // Sequential references let anyone enumerate other people's reservations.
    const refs = new Set(Array.from({ length: 500 }, () => reservationReference()));
    expect(refs.size).toBe(500);
    for (const r of refs) expect(r).toMatch(/^RSV-[0-9A-F]{10}$/);
  });
});
