import { getHdvQuoteInputs, getLandedCostCohort } from "@/lib/queries";
import { buildCohortQuote, buildHdvQuote, calibrate } from "@/lib/landed-cost";
import type { LandedTier } from "@/lib/import-stock";

export interface DutyEstimate {
  ghs: number;
  tier: LandedTier;
  /** Real clearances behind the number, for the "how we know" panel. */
  receipts: Array<{
    label: string;
    totalTax: number;
    assessedAt: string | null;
    port: string;
  }>;
}

/**
 * Estimate duty and levies for a stock listing, best method first.
 *
 * Calls the landed-cost engine directly rather than through its HTTP route: the
 * detail page renders on the server, and a server component fetching its own
 * API would add a network hop and a second chance to fail for no benefit.
 *
 * Returns null when nothing can be said. The pricing layer then declines to
 * quote a total rather than presenting a partial sum as the landed cost.
 */
export async function estimateDutyForListing(input: {
  make: string;
  model: string;
  year: number;
  trim?: string | null;
}): Promise<DutyEstimate | null> {
  const query = {
    make: input.make,
    model: input.model,
    year: input.year,
    ...(input.trim ? { trim: input.trim } : {}),
  };

  try {
    // 1. Anchored to GRA's own reference value for this vehicle.
    const hdv = await getHdvQuoteInputs(query);
    if (hdv) {
      // The car is assessed on arrival, so its age *now* is what matters.
      const ageYears = Math.max(0, new Date().getFullYear() - input.year);
      const calibration = calibrate(hdv.observations, {
        targetAgeYears: ageYears,
        hsCode: hdv.hsCode,
      });
      if (calibration && hdv.fxRate) {
        const quote = buildHdvQuote({
          hdv: hdv.hdv,
          hdvCurrency: hdv.hdvCurrency,
          exactTrim: hdv.exactTrim,
          fxRate: hdv.fxRate,
          ageYears,
          calibration,
        });
        if (quote) {
          return {
            ghs: quote.taxGhs.point,
            tier: quote.tier as LandedTier,
            // The HDV method predicts from GRA's reference value rather than
            // from a cohort, so it carries no receipts of its own. Show the
            // comparable clearances anyway — an EXACT-tier estimate proving
            // itself with less evidence than a MEDIUM one reads as a bluff.
            receipts: await comparableClearances(query),
          };
        }
      }
    }

    // 2. Median of comparable cars that actually cleared.
    const cohort = await getLandedCostCohort(query);
    if (cohort) {
      const quote = buildCohortQuote({
        year: input.year,
        observations: cohort.observations,
        fxRate: cohort.fxRate,
        fxAsOf: cohort.fxAsOf,
      });
      if (quote) {
        return {
          ghs: quote.taxGhs.point,
          tier: quote.tier as LandedTier,
          receipts: toReceipts(quote.receipts),
        };
      }
    }
  } catch (error) {
    // A listing that cannot be priced still has to render. Swallowing here
    // means the page shows "we can't estimate duty for this one yet" instead
    // of a 500.
    console.error("[import-stock:duty]", error);
  }
  return null;
}

/**
 * Comparable cars of this model that actually cleared, for the evidence panel.
 *
 * Returns an empty list rather than throwing: the duty figure stands on its own
 * and a missing receipts panel is a smaller loss than a failed page.
 */
async function comparableClearances(query: {
  make: string;
  model: string;
  year: number;
}): Promise<DutyEstimate["receipts"]> {
  try {
    const cohort = await getLandedCostCohort(query);
    if (!cohort) return [];
    const quote = buildCohortQuote({
      year: query.year,
      observations: cohort.observations,
      fxRate: cohort.fxRate,
      fxAsOf: cohort.fxAsOf,
    });
    return quote ? toReceipts(quote.receipts) : [];
  } catch {
    return [];
  }
}

function toReceipts(
  receipts: Array<{
    trimLevel: string | null;
    yearOfManufacture: number;
    totalTax: number;
    assessedAt: string | null;
    port: string;
  }>,
): DutyEstimate["receipts"] {
  return receipts.slice(0, 4).map((r) => ({
    label: [r.yearOfManufacture, r.trimLevel].filter(Boolean).join(" "),
    totalTax: r.totalTax,
    assessedAt: r.assessedAt,
    port: r.port,
  }));
}
