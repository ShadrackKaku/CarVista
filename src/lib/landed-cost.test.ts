import { describe, expect, it } from "vitest";
import { buildCohortQuote, median, type CohortObservation } from "@/lib/landed-cost";

const NOW = new Date("2026-07-29T00:00:00Z");

const obs = (over: Partial<CohortObservation> = {}): CohortObservation => ({
  trimLevel: "SE",
  yearOfManufacture: 2025,
  hdv: 31000,
  cifNcy: 309985.86,
  totalTax: 154717.49,
  exchangeRate: 11.2981,
  assessedAt: new Date("2026-07-01"),
  port: "Tema",
  ...over,
});

describe("median", () => {
  it("handles odd, even and empty inputs", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(Number.isNaN(median([]))).toBe(true);
  });
});

describe("buildCohortQuote", () => {
  // The real Camry 2025 rows from the ICUMS checker (July 2026).
  const camryCohort = [
    obs(),
    obs({ trimLevel: "XLE", totalTax: 139334.45, exchangeRate: 11.5558, hdv: 33700, assessedAt: new Date("2026-07-20") }),
    obs({ trimLevel: "LE", totalTax: 137694.43, exchangeRate: 11.0555, hdv: 28700, assessedAt: new Date("2026-07-15") }),
    obs({ trimLevel: "NA", totalTax: 159458.01, exchangeRate: 11.2981, hdv: 32525, assessedAt: new Date("2026-07-02") }),
  ];

  it("gives a HIGH-tier quote from ≥3 same-year observations, repriced at the given FX", () => {
    const q = buildCohortQuote({
      year: 2025,
      observations: camryCohort,
      fxRate: 12.0,
      fxAsOf: new Date("2026-07-25"),
      now: NOW,
    });
    expect(q).not.toBeNull();
    expect(q!.tier).toBe("HIGH");
    expect(q!.observationCount).toBe(4);
    // Median of the USD-equivalent taxes × 12.0, and low ≤ point ≤ high.
    const usd = camryCohort.map((o) => o.totalTax / o.exchangeRate!);
    expect(q!.taxUsd.point).toBeCloseTo(median(usd), 1);
    expect(q!.taxGhs.point).toBeCloseTo(median(usd) * 12.0, 0);
    expect(q!.taxGhs.low).toBeLessThanOrEqual(q!.taxGhs.point);
    expect(q!.taxGhs.high).toBeGreaterThanOrEqual(q!.taxGhs.point);
    expect(q!.fxRate).toBe(12.0);
  });

  it("falls to MEDIUM with adjacent-year data and uses the freshest observation's rate when no FX given", () => {
    const q = buildCohortQuote({
      year: 2024, // no same-year rows; ±1 catches the 2025s
      observations: camryCohort.slice(0, 2),
      fxRate: null,
      fxAsOf: null,
      now: NOW,
    });
    expect(q).not.toBeNull();
    expect(q!.tier).toBe("MEDIUM");
    expect(q!.fxRate).toBe(11.5558); // freshest observation (20 Jul)
  });

  it("returns null when there's too little usable data", () => {
    expect(
      buildCohortQuote({ year: 2025, observations: [obs()], fxRate: null, fxAsOf: null, now: NOW }),
    ).toBeNull();
    // Rows without an exchange rate can't inform an estimate.
    const noRates = camryCohort.map((o) => ({ ...o, exchangeRate: null }));
    expect(
      buildCohortQuote({ year: 2025, observations: noRates, fxRate: 12, fxAsOf: null, now: NOW }),
    ).toBeNull();
  });

  it("ignores stale observations beyond maxAgeDays", () => {
    const stale = camryCohort.map((o) => ({ ...o, assessedAt: new Date("2025-01-01") }));
    expect(
      buildCohortQuote({ year: 2025, observations: stale, fxRate: 12, fxAsOf: null, now: NOW }),
    ).toBeNull();
  });

  it("anonymises receipts (no chassis) and caps them at 8", () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      obs({ assessedAt: new Date(`2026-07-${String(i + 1).padStart(2, "0")}`) }),
    );
    const q = buildCohortQuote({ year: 2025, observations: many, fxRate: 12, fxAsOf: null, now: NOW });
    expect(q!.receipts.length).toBe(8);
    expect(Object.keys(q!.receipts[0]).sort()).toEqual(
      ["assessedAt", "hdv", "port", "totalTax", "trimLevel", "yearOfManufacture"].sort(),
    );
    // Freshest first.
    expect(q!.receipts[0].assessedAt).toBe("2026-07-12");
  });
});
