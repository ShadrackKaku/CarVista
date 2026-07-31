/**
 * Data-backed landed-cost estimation.
 *
 * The hard part of a landed-cost quote is duty & taxes: GRA assesses them on
 * ICUMS's own valuation (the HDV), which importers can't see up front. Instead
 * of guessing, we estimate from REAL verified customs outcomes — what identical
 * cars actually paid when they cleared.
 *
 * Core method ("stable value × today's rate"): every levy in the stack is
 * proportional to the CIF value, and the CIF is a USD quantity converted at the
 * week's customs exchange rate. So an observation's `totalTax / exchangeRate`
 * is a stable USD-denominated quantity for that car class. We take the cohort's
 * MEDIAN of that (robust to one odd row) and reprice it at the latest observed
 * customs rate — FX moves are handled by construction, and no formula guess is
 * involved. The classic formula calculator remains the fallback when no cohort
 * data exists.
 *
 * Pure math only — the DB query that feeds this lives in queries.ts.
 */

export interface CohortObservation {
  trimLevel: string | null;
  yearOfManufacture: number;
  /** ICUMS Home Delivery Value, USD (reference "new" value). */
  hdv: number | null;
  /** CIF in GHS as assessed. */
  cifNcy: number | null;
  /** Total tax in GHS as assessed. */
  totalTax: number;
  /** GHS per USD applied on this assessment. */
  exchangeRate: number | null;
  assessedAt: Date | null;
  port: string;
}

export type QuoteTier = "HIGH" | "MEDIUM" | "BASIC";

/** Anonymised "receipt" row shown under the estimate — the trust feature. */
export interface QuoteReceipt {
  trimLevel: string | null;
  yearOfManufacture: number;
  hdv: number | null;
  totalTax: number;
  assessedAt: string | null; // ISO date
  port: string;
}

export interface CohortQuote {
  tier: Exclude<QuoteTier, "BASIC">;
  observationCount: number;
  sameYearCount: number;
  /** Duty & taxes estimate in GHS at `fxRate`. */
  taxGhs: { point: number; low: number; high: number };
  /** The stable USD-equivalent tax the cohort actually paid. */
  taxUsd: { point: number; low: number; high: number };
  fxRate: number;
  fxAsOf: string | null; // ISO date of the observation the rate came from
  receipts: QuoteReceipt[];
}

/** Observations usable for estimation: need the tax and the rate it was
 *  converted at (both visible on every ICUMS checker row). */
function usable(obs: CohortObservation): obs is CohortObservation & { exchangeRate: number } {
  return obs.totalTax > 0 && obs.exchangeRate != null && obs.exchangeRate > 0;
}

export function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** How many days old an observation is (Infinity when undated). */
function ageDays(obs: CohortObservation, now: Date): number {
  return obs.assessedAt
    ? (now.getTime() - obs.assessedAt.getTime()) / 86_400_000
    : Number.POSITIVE_INFINITY;
}

export interface BuildQuoteInput {
  year: number;
  observations: CohortObservation[]; // verified, same model, year ±1
  /** Latest observed customs FX rate (GHS/USD) + when it was observed. */
  fxRate: number | null;
  fxAsOf: Date | null;
  now?: Date;
  /** Observations older than this never inform an estimate. Default 270d. */
  maxAgeDays?: number;
}

/**
 * Turn a cohort of verified observations into a quote, or null when the data
 * can't support one (caller falls back to the BASIC formula calculator).
 *
 * HIGH   — ≥3 usable same-year observations.
 * MEDIUM — ≥2 usable within ±1 year (band widened to the full min–max spread).
 */
export function buildCohortQuote(input: BuildQuoteInput): CohortQuote | null {
  const now = input.now ?? new Date();
  const maxAge = input.maxAgeDays ?? 270;

  const fresh = input.observations.filter(usable).filter((o) => ageDays(o, now) <= maxAge);
  if (fresh.length === 0) return null;

  const sameYear = fresh.filter((o) => o.yearOfManufacture === input.year);
  let tier: CohortQuote["tier"];
  let pool: typeof fresh;
  if (sameYear.length >= 3) {
    tier = "HIGH";
    pool = sameYear;
  } else if (fresh.length >= 2) {
    tier = "MEDIUM";
    pool = fresh;
  } else {
    return null;
  }

  // The stable quantity: what the cohort paid, in USD terms.
  const taxUsdValues = pool.map((o) => o.totalTax / o.exchangeRate);
  const point = median(taxUsdValues);
  const low = Math.min(...taxUsdValues);
  const high = Math.max(...taxUsdValues);

  // Reprice at the latest observed customs rate; if none is known, the most
  // recent observation's own rate is the best available.
  const latestObsRate = [...pool].sort((a, b) => ageDays(a, now) - ageDays(b, now))[0]
    .exchangeRate;
  const fxRate = input.fxRate ?? latestObsRate;
  const fxAsOf = input.fxRate != null ? input.fxAsOf : null;

  const receipts: QuoteReceipt[] = [...fresh]
    .sort((a, b) => ageDays(a, now) - ageDays(b, now))
    .slice(0, 8)
    .map((o) => ({
      trimLevel: o.trimLevel,
      yearOfManufacture: o.yearOfManufacture,
      hdv: o.hdv,
      totalTax: o.totalTax,
      assessedAt: o.assessedAt ? o.assessedAt.toISOString().slice(0, 10) : null,
      port: o.port,
    }));

  const r2 = (n: number) => Math.round(n * 100) / 100;
  return {
    tier,
    observationCount: pool.length,
    sameYearCount: sameYear.length,
    taxUsd: { point: r2(point), low: r2(low), high: r2(high) },
    taxGhs: { point: r2(point * fxRate), low: r2(low * fxRate), high: r2(high * fxRate) },
    fxRate,
    fxAsOf: fxAsOf ? fxAsOf.toISOString().slice(0, 10) : null,
    receipts,
  };
}

// ─────────────────────────────────────────────────────────────
//  HDV-anchored estimation (v2)
//
//  Observed ICUMS rows show the whole assessment is proportional to the
//  vehicle's HDV: depreciation, CIF build-up and the levy stack are all
//  multiplicative. So `totalTax / (HDV × FX)` — the tax as a multiple of the
//  HDV converted at that assessment's own rate — is a single stable ratio.
//  On the real Camry rows it lands at 0.4340 for three of four rows (the
//  fourth is a known outlier), and applying it back reproduces actual tax to
//  within ~0.01%.
//
//  Predicting from a stored HDV therefore beats averaging past tax amounts:
//  it is trim-specific, it transfers across cars we've never seen assessed,
//  and today's FX is applied fresh. We keep the two-part decomposition
//  (effective tax rate × CIF factor) alongside it purely to explain the
//  number to the user.
// ─────────────────────────────────────────────────────────────

export interface CalibrationObservation {
  hsCode: string | null;
  hdv: number | null;
  cifNcy: number | null;
  totalTax: number;
  exchangeRate: number | null;
  yearOfManufacture: number;
  assessedAt: Date | null;
}

/** Tax as a multiple of HDV-in-GHS — the ratio the estimate is built on. */
export function taxPerHdvGhs(o: CalibrationObservation): number | null {
  if (!o.hdv || !o.exchangeRate || o.hdv <= 0 || o.exchangeRate <= 0) return null;
  const hdvGhs = o.hdv * o.exchangeRate;
  return hdvGhs > 0 ? o.totalTax / hdvGhs : null;
}

/** Total tax ÷ CIF — near-constant per HS code. Shown, not used to predict. */
export function observedEffectiveRate(o: CalibrationObservation): number | null {
  if (!o.cifNcy || o.cifNcy <= 0) return null;
  return o.totalTax / o.cifNcy;
}

/** CIF ÷ (HDV × FX) — depreciation plus freight. Shown, not used to predict. */
export function observedCifFactor(o: CalibrationObservation): number | null {
  if (!o.cifNcy || !o.hdv || !o.exchangeRate) return null;
  const hdvGhs = o.hdv * o.exchangeRate;
  return hdvGhs > 0 ? o.cifNcy / hdvGhs : null;
}

/** Vehicle age at the moment it was assessed (null when undated). */
export function ageAtAssessment(o: CalibrationObservation): number | null {
  if (!o.assessedAt) return null;
  return o.assessedAt.getFullYear() - o.yearOfManufacture;
}

export type CalibrationBasis = "AGE" | "HS_CODE" | "GLOBAL";

export interface Calibration {
  /** Median tax-per-HDV-GHS, and the spread across the pool. */
  ratio: { point: number; low: number; high: number };
  /** Which pool the numbers came from, and how big it was. */
  basis: CalibrationBasis;
  sampleSize: number;
  /** Decomposition for the "how we worked this out" panel (may be null). */
  effectiveRate: number | null;
  cifFactor: number | null;
}

/**
 * Calibrate the ratio from observations, preferring the most specific pool
 * that has enough data: same vehicle age → same HS code → everything.
 * Age comes first because depreciation is the biggest driver of variation.
 */
export function calibrate(
  observations: CalibrationObservation[],
  opts: { targetAgeYears: number; hsCode?: string | null; minSamples?: number },
): Calibration | null {
  const minSamples = opts.minSamples ?? 2;
  const usable = observations.filter((o) => taxPerHdvGhs(o) !== null);
  if (usable.length === 0) return null;

  const sameAge = usable.filter((o) => {
    const age = ageAtAssessment(o);
    return age !== null && age === opts.targetAgeYears;
  });
  const sameHs = opts.hsCode
    ? usable.filter((o) => o.hsCode && o.hsCode === opts.hsCode)
    : [];

  let pool = usable;
  let basis: CalibrationBasis = "GLOBAL";
  if (sameAge.length >= minSamples) {
    pool = sameAge;
    basis = "AGE";
  } else if (sameHs.length >= minSamples) {
    pool = sameHs;
    basis = "HS_CODE";
  }

  const ratios = pool.map(taxPerHdvGhs).filter((r): r is number => r !== null);
  if (ratios.length === 0) return null;

  const rates = pool.map(observedEffectiveRate).filter((r): r is number => r !== null);
  const factors = pool.map(observedCifFactor).filter((r): r is number => r !== null);

  return {
    ratio: { point: median(ratios), low: Math.min(...ratios), high: Math.max(...ratios) },
    basis,
    sampleSize: pool.length,
    effectiveRate: rates.length ? median(rates) : null,
    cifFactor: factors.length ? median(factors) : null,
  };
}

export interface HdvQuote {
  /** EXACT = we hold the HDV for this precise trim; MODEL = model-year median. */
  tier: "EXACT" | "MODEL";
  taxGhs: { point: number; low: number; high: number };
  /** The inputs, so the user can check the arithmetic themselves. */
  hdv: number;
  hdvCurrency: string;
  fxRate: number;
  ageYears: number;
  calibration: Calibration;
  receipts: QuoteReceipt[];
}

export interface BuildHdvQuoteInput {
  hdv: number;
  hdvCurrency?: string;
  /** True when the HDV is for the exact trim the user chose. */
  exactTrim: boolean;
  fxRate: number;
  ageYears: number;
  calibration: Calibration;
  receipts?: QuoteReceipt[];
}

/** Turn a stored HDV plus a calibration into a quote. */
export function buildHdvQuote(input: BuildHdvQuoteInput): HdvQuote | null {
  if (input.hdv <= 0 || input.fxRate <= 0) return null;
  const hdvGhs = input.hdv * input.fxRate;
  const r2 = (n: number) => Math.round(n * 100) / 100;

  return {
    tier: input.exactTrim ? "EXACT" : "MODEL",
    taxGhs: {
      point: r2(input.calibration.ratio.point * hdvGhs),
      low: r2(input.calibration.ratio.low * hdvGhs),
      high: r2(input.calibration.ratio.high * hdvGhs),
    },
    hdv: input.hdv,
    hdvCurrency: input.hdvCurrency ?? "USD",
    fxRate: input.fxRate,
    ageYears: input.ageYears,
    calibration: input.calibration,
    receipts: input.receipts ?? [],
  };
}
