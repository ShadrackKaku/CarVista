import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { dutyAssessmentSchema } from "@/lib/validations";
import { rateLimit, getClientId } from "@/lib/rate-limit";

/**
 * POST /api/duty-assessments — public submission of a real ICUMS duty outcome
 * (the "submit your tax bill" flow). Stored as PENDING until an admin verifies
 * it; only VERIFIED rows ever train the landed-cost engine.
 */
export async function POST(req: Request) {
  const limit = await rateLimit(`duty-assess:${getClientId(req)}`, 5, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many submissions. Try again later." }, { status: 429 });
  }

  try {
    const parsed = dutyAssessmentSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const user = await getCurrentUser().catch(() => null);

    const assessment = await prisma.dutyAssessment.create({
      data: {
        chassisNumber: d.chassisNumber,
        make: d.make,
        modelType: d.modelType,
        yearOfManufacture: d.yearOfManufacture,
        totalTax: d.totalTax,
        trimLevel: d.trimLevel || null,
        vehicleType: d.vehicleType || null,
        engineSizeCc: d.engineSizeCc ?? null,
        originCode: d.originCode || null,
        color: d.color || null,
        fuelType: d.fuelType || null,
        hsCode: d.hsCode || null,
        hdv: d.hdv ?? null,
        fobNcy: d.fobNcy ?? null,
        cifNcy: d.cifNcy ?? null,
        assessedAt: d.assessedAt ?? null,
        port: d.port || "Tema",
        exchangeRate: d.exchangeRate ?? null,
        icumsMakeCode: d.icumsMakeCode || null,
        icumsModelCode: d.icumsModelCode || null,
        source: "COMMUNITY",
        documentUrls: d.documentUrls ?? [],
        notes: d.notes || null,
        submittedById: user?.id ?? null,
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, id: assessment.id }, { status: 201 });
  } catch (error) {
    console.error("[duty-assessments]", error);
    return NextResponse.json({ error: "Failed to submit. Please try again." }, { status: 500 });
  }
}
