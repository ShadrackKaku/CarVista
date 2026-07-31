import { describe, expect, it } from "vitest";
import {
  ageAtAssessment,
  buildCohortQuote,
  buildHdvQuote,
  calibrate,
  median,
  type CohortObservation,
} from "@/lib/landed-cost";

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

describe("HDV-anchored estimation (v2)", () => {
  // The real ICUMS Camry 2025 rows, in calibration shape.
  const calObs = [
    { hsCode: "8703402000", hdv: 31000, cifNcy: 309985.86, totalTax: 154717.49, exchangeRate: 11.2981, yearOfManufacture: 2025, assessedAt: new Date("2026-07-01") },
    { hsCode: "8703402000", hdv: 33700, cifNcy: 284883.28, totalTax: 139334.45, exchangeRate: 11.5558, yearOfManufacture: 2025, assessedAt: new Date("2026-07-20") },
    { hsCode: "8703402000", hdv: 28700, cifNcy: 281527.09, totalTax: 137694.43, exchangeRate: 11.0555, yearOfManufacture: 2025, assessedAt: new Date("2026-07-15") },
    { hsCode: "8703402000", hdv: 32525, cifNcy: 326024.19, totalTax: 159458.01, exchangeRate: 11.2981, yearOfManufacture: 2025, assessedAt: new Date("2026-07-02") },
  ];

  it("derives a stable tax-per-HDV ratio and the decomposition", () => {
    const cal = calibrate(calObs, { targetAgeYears: 1, hsCode: "8703402000" })!;
    expect(cal).not.toBeNull();
    expect(cal.basis).toBe("AGE"); // all four are 1 year old at assessment
    expect(cal.sampleSize).toBe(4);
    expect(cal.ratio.point).toBeCloseTo(0.434, 3);
    // The decomposition shown to users: ~48.91% of CIF, CIF ~0.887 of HDV.
    expect(cal.effectiveRate!).toBeCloseTo(0.4891, 3);
    expect(cal.cifFactor!).toBeCloseTo(0.886, 2);
  });

  it("reproduces a real assessment from HDV alone", () => {
    const cal = calibrate(calObs, { targetAgeYears: 1, hsCode: "8703402000" })!;
    // Predict the LE row (HDV 28,700 at its own rate) and compare to actual.
    const quote = buildHdvQuote({
      hdv: 28700,
      exactTrim: true,
      fxRate: 11.0555,
      ageYears: 1,
      calibration: cal,
    })!;
    expect(quote.tier).toBe("EXACT");
    expect(quote.taxGhs.point).toBeCloseTo(137694.43, -2); // within ~GHS 50
    expect(quote.taxGhs.low).toBeLessThanOrEqual(quote.taxGhs.point);
    expect(quote.taxGhs.high).toBeGreaterThanOrEqual(quote.taxGhs.point);
  });

  it("falls back through age → HS code → global as data thins", () => {
    // No observation matches age 9, but the HS code does.
    const byHs = calibrate(calObs, { targetAgeYears: 9, hsCode: "8703402000" })!;
    expect(byHs.basis).toBe("HS_CODE");
    // Neither age nor HS code match — still usable, flagged GLOBAL.
    const global = calibrate(calObs, { targetAgeYears: 9, hsCode: "9999999999" })!;
    expect(global.basis).toBe("GLOBAL");
    expect(global.sampleSize).toBe(4);
  });

  it("marks a model-year median HDV as MODEL rather than EXACT", () => {
    const cal = calibrate(calObs, { targetAgeYears: 1 })!;
    const quote = buildHdvQuote({ hdv: 31000, exactTrim: false, fxRate: 12, ageYears: 1, calibration: cal })!;
    expect(quote.tier).toBe("MODEL");
    expect(quote.hdvCurrency).toBe("USD");
  });

  it("returns null when there's nothing to calibrate from or the inputs are invalid", () => {
    expect(calibrate([], { targetAgeYears: 1 })).toBeNull();
    const noHdv = calObs.map((o) => ({ ...o, hdv: null }));
    expect(calibrate(noHdv, { targetAgeYears: 1 })).toBeNull();
    const cal = calibrate(calObs, { targetAgeYears: 1 })!;
    expect(buildHdvQuote({ hdv: 0, exactTrim: true, fxRate: 12, ageYears: 1, calibration: cal })).toBeNull();
  });

  it("computes age at assessment, not age today", () => {
    expect(ageAtAssessment(calObs[0])).toBe(1);
    expect(ageAtAssessment({ ...calObs[0], assessedAt: null })).toBeNull();
  });
});
