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
