import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dutyCalcSchema } from "@/lib/validations";
import { calculateDuty, type DutyRateSet } from "@/lib/duty-calculator";
import { rateLimit, getClientId } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: Request) {
  const limit = await rateLimit(`duty:${getClientId(req)}`, 30, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = dutyCalcSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const data = parsed.data;

    // Load the active, best-matching admin rate set for this vehicle category.
    let rates: Partial<DutyRateSet> | undefined;
    try {
      const dutyRate = await prisma.dutyRate.findFirst({
        where: {
          active: true,
          bodyTypes: { has: data.bodyType },
          OR: [
            { engineMin: null, engineMax: null },
            { engineMin: { lte: data.engineSizeCc }, engineMax: { gte: data.engineSizeCc } },
          ],
        },
        orderBy: { effectiveFrom: "desc" },
      });
      if (dutyRate) {
        rates = {
          importDutyRate: dutyRate.importDutyRate,
          vatRate: dutyRate.vatRate,
          nhilRate: dutyRate.nhilRate,
          getfundRate: dutyRate.getfundRate,
          ecowasLevyRate: dutyRate.ecowasLevyRate,
          auLevyRate: dutyRate.auLevyRate,
          eximLevyRate: dutyRate.eximLevyRate,
          specialImportLevyRate: dutyRate.specialImportLevyRate,
          examinationFee: dutyRate.examinationFee,
          networkCharge: dutyRate.networkCharge,
        };
      }
    } catch {
      // DB unavailable — fall back to default rates in the calculator.
    }

    const result = calculateDuty({
      cifValue: data.cifValue,
      currency: data.currency,
      exchangeRate: data.exchangeRate,
      manufactureYear: data.manufactureYear,
      engineSizeCc: data.engineSizeCc,
      fuelType: data.fuelType,
      bodyType: data.bodyType,
      shippingCost: data.shippingCost,
      rates,
    });

    // Optionally persist the calculation for logged-in users / analytics.
    const user = await getCurrentUser().catch(() => null);
    if (user) {
      const li = (key: string) => result.lineItems.find((x) => x.key === key)?.amount ?? 0;
      await prisma.dutyCalculation
        .create({
          data: {
            userId: user.id,
            year: data.manufactureYear,
            cifValue: result.cifGhs,
            engineSize: data.engineSizeCc,
            fuelType: data.fuelType,
            bodyType: data.bodyType,
            importDuty: li("importDuty"),
            vat: li("vat"),
            nhil: li("nhil"),
            getfund: li("getfund"),
            // Everything that isn't duty or the VAT family on the goods value.
            otherLevies: result.taxLineItems
              .filter((x) => !["importDuty", "vat", "nhil", "getfund"].includes(x.key))
              .reduce((sum, x) => sum + x.amount, 0),
            processingFees: result.logisticsSubtotal,
            totalLandedCost: result.totalLandedCost,
          },
        })
        .catch(() => null);
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("[duty]", error);
    return NextResponse.json({ error: "Calculation failed" }, { status: 500 });
  }
}
