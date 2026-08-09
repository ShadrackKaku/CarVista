/**
 * What a car on an importer's shelf actually costs to land in Ghana.
 *
 * This is the reason to browse stock here rather than on SBT or BE FORWARD.
 * They publish FOB — the price at the port of loading — and a Ghanaian buyer
 * discovers duty at Tema, weeks later, having already committed. CarVista holds
 * verified GRA assessments and HDV reference values, so the number that
 * actually matters can be put on the card.
 *
 * The breakdown is deliberately itemised rather than rolled into one figure.
 * Duty is an *estimate* until GRA assesses the specific chassis, and a single
 * confident-looking total would hide which part of it is a promise (the FOB and
 * the importer's fee) and which part is a forecast.
 */

export type LandedTier = "EXACT" | "MODEL" | "HIGH" | "MEDIUM" | "BASIC";

export interface StockPricingInput {
  fobAmount: number;
  fobCurrency: string;
  /** Cedis per unit of `fobCurrency`, as quoted by the importer. */
  fxRateToGhs: number | null;
  serviceFeeGhs: number | null;
  freightGhs: number | null;
  /** From the landed-cost engine. Null when we cannot estimate this car. */
  estimatedDutyGhs: number | null;
  dutyTier: LandedTier | null;
}

export interface StockPricingLine {
  label: string;
  amountGhs: number;
  /** False for anything we are forecasting rather than quoting. */
  quoted: boolean;
  note?: string;
}

export interface StockPricing {
  lines: StockPricingLine[];
  /** Sum of everything we can price. */
  totalGhs: number | null;
  /** Only the parts the importer has committed to. Always known. */
  committedGhs: number | null;
  /**
   * True when at least one component is missing, so the total understates the
   * real cost. The UI must not print a confident figure when this is set.
   */
  incomplete: boolean;
  missing: string[];
  dutyTier: LandedTier | null;
}

/** Cedi value of the FOB, or null when no rate has been quoted. */
export function fobInGhs(input: Pick<StockPricingInput, "fobAmount" | "fxRateToGhs">): number | null {
  if (input.fxRateToGhs == null || !Number.isFinite(input.fxRateToGhs)) return null;
  if (input.fxRateToGhs <= 0) return null;
  return round2(input.fobAmount * input.fxRateToGhs);
}

/**
 * Build the landed-cost breakdown.
 *
 * A missing component makes the total `null` rather than a smaller number.
 * Silently summing what happens to be present would quote a car at less than it
 * costs — the single most damaging thing this page could do, because the buyer
 * finds out at the port.
 */
export function stockPricing(input: StockPricingInput): StockPricing {
  const lines: StockPricingLine[] = [];
  const missing: string[] = [];

  const fob = fobInGhs(input);
  if (fob == null) {
    missing.push("FOB in cedis (no exchange rate on the listing)");
  } else {
    lines.push({
      label: `FOB (${formatSourceAmount(input.fobAmount, input.fobCurrency)})`,
      amountGhs: fob,
      quoted: true,
      // GH₵ (U+20B5), matching formatCurrency — the ¢ cent sign next to it in
      // the same breakdown reads as a different currency.
      note: `at ${input.fobCurrency} 1 = GH₵${input.fxRateToGhs}`,
    });
  }

  if (input.freightGhs == null) {
    missing.push("ocean freight");
  } else {
    lines.push({ label: "Shipping to Tema", amountGhs: round2(input.freightGhs), quoted: true });
  }

  if (input.estimatedDutyGhs == null) {
    missing.push("duty and levies");
  } else {
    lines.push({
      label: "Duty & levies (estimated)",
      amountGhs: round2(input.estimatedDutyGhs),
      quoted: false,
      note: dutyNote(input.dutyTier),
    });
  }

  // The importer's fee is the one line that may legitimately be zero — some
  // build it into the FOB — so absence is not treated as missing information.
  if (input.serviceFeeGhs != null && input.serviceFeeGhs > 0) {
    lines.push({
      label: "Importer's fee",
      amountGhs: round2(input.serviceFeeGhs),
      quoted: true,
    });
  }

  const committed = lines.filter((l) => l.quoted).reduce((sum, l) => sum + l.amountGhs, 0);
  const incomplete = missing.length > 0;

  return {
    lines,
    totalGhs: incomplete ? null : round2(lines.reduce((sum, l) => sum + l.amountGhs, 0)),
    committedGhs: fob == null ? null : round2(committed),
    incomplete,
    missing,
    dutyTier: input.dutyTier,
  };
}

/**
 * How much to trust the duty figure, in the buyer's words rather than ours.
 *
 * The tiers come from the landed-cost engine: EXACT and MODEL are anchored to
 * GRA's own reference value for the vehicle, HIGH and MEDIUM to the median of
 * comparable cars that actually cleared, BASIC to the published formula alone.
 */
export function dutyNote(tier: LandedTier | null): string | undefined {
  switch (tier) {
    case "EXACT":
      return "From GRA's reference value for this exact trim";
    case "MODEL":
      return "From GRA's reference value for this model";
    case "HIGH":
      return "Median of several comparable cars cleared recently";
    case "MEDIUM":
      return "Based on a small sample of comparable clearances";
    case "BASIC":
      return "Formula only — no comparable clearances on file yet";
    default:
      return undefined;
  }
}

export const TIER_CONFIDENCE: Record<LandedTier, "high" | "medium" | "low"> = {
  EXACT: "high",
  MODEL: "high",
  HIGH: "medium",
  MEDIUM: "medium",
  BASIC: "low",
};

/** JPY has no minor unit; the rest are shown with two decimals. */
export function formatSourceAmount(amount: number, currency: string): string {
  const zeroDecimal = currency === "JPY" || currency === "KRW";
  return `${currency} ${amount.toLocaleString("en-GH", {
    minimumFractionDigits: zeroDecimal ? 0 : 2,
    maximumFractionDigits: zeroDecimal ? 0 : 2,
  })}`;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Source markets an importer can list from, for the console's picker. */
export const SOURCE_MARKETS = [
  "Japan",
  "United Kingdom",
  "United States",
  "Germany",
  "Dubai (UAE)",
  "South Korea",
  "Canada",
  "Belgium",
] as const;

/** Currencies those markets actually quote in. */
export const FOB_CURRENCIES = ["JPY", "USD", "GBP", "EUR", "AED", "KRW", "CAD"] as const;
