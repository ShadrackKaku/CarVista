import { NextResponse } from "next/server";
import { getHdvQuoteInputs, getLandedCostCohort } from "@/lib/queries";
import { buildCohortQuote, buildHdvQuote, calibrate } from "@/lib/landed-cost";
import { landedCostQuerySchema } from "@/lib/validations";
import { rateLimit, getClientId } from "@/lib/rate-limit";

/**
 * POST /api/calculators/landed-cost — duty & taxes estimate, best method first.
 *
 * 1. HDV-anchored (EXACT / MODEL) — we hold GRA's reference value for this
 *    vehicle, so we apply the calibrated tax-per-HDV ratio at today's rate.
 *    Most accurate, and works even for cars we've never seen assessed.
 * 2. Cohort (HIGH / MEDIUM) — no stored HDV, but similar cars cleared recently.
 * 3. BASIC — no usable data; the client falls back to the formula calculator.
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
    const input = parsed.data;

    // ---- 1. HDV-anchored ----
    const hdvInputs = await getHdvQuoteInputs(input);
    if (hdvInputs) {
      // The car is assessed on arrival, so its age "now" is what matters.
      const ageYears = Math.max(0, new Date().getFullYear() - input.year);
      const calibration = calibrate(hdvInputs.observations, {
        targetAgeYears: ageYears,
        hsCode: hdvInputs.hsCode,
      });
      const fxRate = hdvInputs.fxRate;
      if (calibration && fxRate) {
        const quote = buildHdvQuote({
          hdv: hdvInputs.hdv,
          hdvCurrency: hdvInputs.hdvCurrency,
          exactTrim: hdvInputs.exactTrim,
          fxRate,
          ageYears,
          calibration,
        });
        if (quote) {
          // Show comparable clearances alongside, when we have them.
          const cohort = await getLandedCostCohort(input);
          const receipts = cohort
            ? (buildCohortQuote({
                year: input.year,
                observations: cohort.observations,
                fxRate: cohort.fxRate,
                fxAsOf: cohort.fxAsOf,
              })?.receipts ?? [])
            : [];
          return NextResponse.json({
            ...quote,
            receipts,
            availableTrims: hdvInputs.availableTrims,
            hsCode: hdvInputs.hsCode,
            fxAsOf: hdvInputs.fxAsOf ? hdvInputs.fxAsOf.toISOString().slice(0, 10) : null,
          });
        }
      }
    }

    // ---- 2. Cohort of recent clearances ----
    const cohort = await getLandedCostCohort(input);
    const cohortQuote = cohort
      ? buildCohortQuote({
          year: input.year,
          observations: cohort.observations,
          fxRate: cohort.fxRate,
          fxAsOf: cohort.fxAsOf,
        })
      : null;
    if (cohortQuote) return NextResponse.json(cohortQuote);

    // ---- 3. Nothing usable ----
    return NextResponse.json({ tier: "BASIC" });
  } catch (error) {
    console.error("[landed-cost]", error);
    return NextResponse.json({ error: "Estimate failed. Please try again." }, { status: 500 });
  }
}
