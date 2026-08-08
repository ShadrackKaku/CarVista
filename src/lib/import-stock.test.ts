import { describe, it, expect } from "vitest";
import {
  TIER_CONFIDENCE,
  dutyNote,
  fobInGhs,
  formatSourceAmount,
  stockPricing,
  type StockPricingInput,
} from "./import-stock";

const complete: StockPricingInput = {
  fobAmount: 450_000,
  fobCurrency: "JPY",
  fxRateToGhs: 0.085,
  serviceFeeGhs: 4_000,
  freightGhs: 18_000,
  estimatedDutyGhs: 61_500,
  dutyTier: "MODEL",
};

describe("fobInGhs", () => {
  it("converts at the rate the importer quoted", () => {
    expect(fobInGhs({ fobAmount: 450_000, fxRateToGhs: 0.085 })).toBe(38_250);
  });

  it("returns null rather than guessing when there is no rate", () => {
    // Falling back to 1:1, or to a USD rate we happen to hold, would price a
    // ¥450,000 car at GH¢450,000 or GH¢5m. Both are worse than "not priced".
    expect(fobInGhs({ fobAmount: 450_000, fxRateToGhs: null })).toBeNull();
    expect(fobInGhs({ fobAmount: 450_000, fxRateToGhs: 0 })).toBeNull();
    expect(fobInGhs({ fobAmount: 450_000, fxRateToGhs: -1 })).toBeNull();
    expect(fobInGhs({ fobAmount: 450_000, fxRateToGhs: NaN })).toBeNull();
  });
});

describe("stockPricing", () => {
  it("itemises a fully priced car and totals it", () => {
    const p = stockPricing(complete);
    expect(p.incomplete).toBe(false);
    expect(p.totalGhs).toBe(38_250 + 18_000 + 61_500 + 4_000);
    expect(p.lines.map((l) => l.label)).toEqual([
      "FOB (JPY 450,000)",
      "Shipping to Tema",
      "Duty & levies (estimated)",
      "Importer's fee",
    ]);
  });

  it("separates what is quoted from what is forecast", () => {
    // The buyer needs to know which part of the number can move. Duty is the
    // only line that is not a commitment.
    const p = stockPricing(complete);
    const forecast = p.lines.filter((l) => !l.quoted).map((l) => l.label);
    expect(forecast).toEqual(["Duty & levies (estimated)"]);
    expect(p.committedGhs).toBe(38_250 + 18_000 + 4_000);
  });

  it("refuses to total a car it cannot fully price", () => {
    // The damaging failure: quietly summing the lines we happen to have would
    // advertise a car for less than it costs, and the buyer finds out at Tema.
    const p = stockPricing({ ...complete, estimatedDutyGhs: null, dutyTier: null });
    expect(p.totalGhs).toBeNull();
    expect(p.incomplete).toBe(true);
    expect(p.missing).toContain("duty and levies");
    // What the importer has committed to is still known and still shown.
    expect(p.committedGhs).toBe(38_250 + 18_000 + 4_000);
  });

  it("names every missing component", () => {
    const p = stockPricing({
      ...complete,
      fxRateToGhs: null,
      freightGhs: null,
      estimatedDutyGhs: null,
      dutyTier: null,
    });
    expect(p.missing).toHaveLength(3);
    expect(p.totalGhs).toBeNull();
    expect(p.committedGhs).toBeNull();
  });

  it("treats a missing importer fee as zero, not as missing information", () => {
    // Some importers build their margin into the FOB. That is a complete
    // listing, not an incomplete one.
    const p = stockPricing({ ...complete, serviceFeeGhs: null });
    expect(p.incomplete).toBe(false);
    expect(p.missing).toHaveLength(0);
    expect(p.lines.map((l) => l.label)).not.toContain("Importer's fee");
    expect(p.totalGhs).toBe(38_250 + 18_000 + 61_500);
  });

  it("omits a zero fee line rather than printing GH¢0", () => {
    expect(stockPricing({ ...complete, serviceFeeGhs: 0 }).lines.map((l) => l.label)).not.toContain(
      "Importer's fee",
    );
  });

  it("shows the rate it converted at", () => {
    const fobLine = stockPricing(complete).lines[0];
    expect(fobLine.note).toBe("at JPY 1 = GH¢0.085");
  });

  it("rounds to the pesewa", () => {
    // Asserted as "carries no value below a pesewa" rather than
    // `Number.isInteger(v * 100)` — 38570.54 * 100 is 3857053.9999999995 in
    // binary floating point, so that test fails on correctly rounded money.
    const p = stockPricing({ ...complete, fxRateToGhs: 0.0857123, freightGhs: 18_000.555 });
    for (const line of p.lines) {
      expect(line.amountGhs, line.label).toBe(Number(line.amountGhs.toFixed(2)));
    }
  });
});

describe("duty confidence", () => {
  it("explains each tier in the buyer's terms", () => {
    for (const tier of ["EXACT", "MODEL", "HIGH", "MEDIUM", "BASIC"] as const) {
      expect(dutyNote(tier)).toBeTruthy();
      expect(TIER_CONFIDENCE[tier]).toBeTruthy();
    }
    expect(dutyNote(null)).toBeUndefined();
  });

  it("does not oversell a formula-only estimate", () => {
    // BASIC means no comparable car has actually cleared. Presenting that with
    // the same confidence as an HDV-anchored figure would be a lie of tone.
    expect(TIER_CONFIDENCE.BASIC).toBe("low");
    expect(dutyNote("BASIC")).toContain("no comparable clearances");
    expect(TIER_CONFIDENCE.EXACT).toBe("high");
  });
});

describe("formatSourceAmount", () => {
  it("drops the decimals for currencies that have no minor unit", () => {
    expect(formatSourceAmount(450_000, "JPY")).toBe("JPY 450,000");
    expect(formatSourceAmount(12_500, "KRW")).toBe("KRW 12,500");
  });

  it("keeps them for everything else", () => {
    expect(formatSourceAmount(8_500, "USD")).toBe("USD 8,500.00");
  });
});
