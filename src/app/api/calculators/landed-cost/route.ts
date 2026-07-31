import { NextResponse } from "next/server";
import { getLandedCostCohort } from "@/lib/queries";
import { buildCohortQuote } from "@/lib/landed-cost";
import { landedCostQuerySchema } from "@/lib/validations";
import { rateLimit, getClientId } from "@/lib/rate-limit";

/**
 * POST /api/calculators/landed-cost — data-backed duty & taxes estimate.
 *
 * Looks up verified customs outcomes for the requested model cohort and, when
 * the data supports it, returns a HIGH/MEDIUM-confidence estimate (median
 * USD-equivalent tax repriced at the latest observed customs FX rate) plus the
 * anonymised "receipts". `tier: "BASIC"` means no usable cohort — the client
 * falls back to the classic formula calculator.
 */
export async function POST(req: Request) {
  const limit = await rateLimit(`landed-cost:${getClientId(req)}`, 20, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  try {
    const parsed = landedCostQuerySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const cohort = await getLandedCostCohort(parsed.data);
    const quote = cohort
      ? buildCohortQuote({
          year: parsed.data.year,
          observations: cohort.observations,
          fxRate: cohort.fxRate,
          fxAsOf: cohort.fxAsOf,
        })
      : null;

    if (!quote) {
      return NextResponse.json({ tier: "BASIC" });
    }
    return NextResponse.json(quote);
  } catch (error) {
    console.error("[landed-cost]", error);
    return NextResponse.json({ error: "Estimate failed. Please try again." }, { status: 500 });
  }
}
