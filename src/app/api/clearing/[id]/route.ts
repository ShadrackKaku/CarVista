import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { rateLimit, getClientId } from "@/lib/rate-limit";
import { addVehicleEvent } from "@/lib/passport";
import { recordClearanceSchema } from "@/lib/validations";
import { assessmentFromClearance, canRecordClearance } from "@/lib/clearing";
import { STAGE_TO_PASSPORT } from "@/lib/import-to-inventory";
import { isAdmin } from "@/lib/roles";

/**
 * POST /api/clearing/[id] — the agent records what customs actually charged.
 *
 * The most valuable write in the platform, for a reason that is not obvious:
 * the duty figure entered here is the ground truth the entire landed-cost
 * engine is built to predict. Every other source we have is second-hand — the
 * public ICUMS checker, community submissions, historical bills. This one comes
 * from the licensed broker who stood at the counter and paid it, against an
 * entry number that can be checked.
 *
 * So the clearance does three things at once. It moves the car, it tells the
 * buyer what their estimate was really worth, and it becomes a DutyAssessment
 * that makes the next estimate better. The platform is the only party that can
 * close that loop, because it is the only one holding both the quote and the
 * bill for the same vehicle.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const limit = await rateLimit(`clearance:${getClientId(req)}`, 20, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const parsed = recordClearanceSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid clearance" },
      { status: 400 },
    );
  }
  const input = parsed.data;

  try {
    const request = await prisma.importRequest.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        stage: true,
        requestNumber: true,
        vehicleId: true,
        make: true,
        model: true,
        year: true,
        quotedDuty: true,
        quotedCif: true,
        clearedAt: true,
        clearingAgent: { select: { id: true, userId: true, businessName: true } },
        listing: {
          select: { make: true, model: true, year: true, chassisNumber: true, engineSize: true, fuelType: true },
        },
      },
    });
    if (!request) return NextResponse.json({ error: "Import not found" }, { status: 404 });

    // Only the broker actually engaged on this car, or an administrator acting
    // for them. Not the buyer: the whole point of the figure is that it comes
    // from the person who paid the bill.
    const isAssignedAgent = request.clearingAgent?.userId === user.id;
    if (!isAssignedAgent && !isAdmin(user.role)) {
      return NextResponse.json({ error: "This clearance is not yours" }, { status: 403 });
    }

    if (request.clearedAt) {
      return NextResponse.json(
        { error: "This car has already been cleared." },
        { status: 409 },
      );
    }

    if (!canRecordClearance(request.stage)) {
      return NextResponse.json(
        { error: "This car is not at the port." },
        { status: 409 },
      );
    }

    const stock = request.listing;
    const make = stock?.make ?? request.make;
    const model = stock?.model ?? request.model;
    const year = stock?.year ?? request.year;
    const assessedAt = input.assessedAt ? new Date(input.assessedAt) : new Date();
    const assessedOn = Number.isNaN(assessedAt.getTime()) ? new Date() : assessedAt;

    await prisma.$transaction(async (tx) => {
      await tx.importRequest.update({
        where: { id: request.id },
        data: {
          actualDutyGhs: new Prisma.Decimal(input.actualDutyGhs),
          customsEntryNumber: input.customsEntryNumber,
          clearedAt: assessedOn,
          clearedById: user.id,
          // The car is through customs and waiting to be collected. The
          // milestone recorded below is CUSTOMS_CLEARANCE — what happened —
          // while the stage is where the car now is.
          stage: "READY_FOR_DELIVERY",
        },
      });

      await tx.importTrackingEvent.create({
        data: {
          importRequestId: request.id,
          stage: "CUSTOMS_CLEARANCE",
          title: "Customs cleared",
          description:
            input.notes ||
            `Entry ${input.customsEntryNumber}. Duty paid GH₵${input.actualDutyGhs.toLocaleString()}.`,
          location: "Tema",
          timestamp: assessedOn,
        },
      });

      // Training data for the duty engine — PENDING until an administrator
      // checks it against the entry number. See assessmentFromClearance.
      await tx.dutyAssessment.create({
        data: assessmentFromClearance({
          make,
          modelType: model,
          yearOfManufacture: year,
          chassisNumber: stock?.chassisNumber ?? null,
          engineSizeCc: stock?.engineSize ? Math.round(stock.engineSize * 1000) : null,
          fuelType: stock?.fuelType ?? null,
          port: "Tema",
          totalTax: input.actualDutyGhs,
          predictedTotalTax: request.quotedDuty ? Number(request.quotedDuty) : null,
          cifNcy: request.quotedCif ? Number(request.quotedCif) : null,
          customsEntryNumber: input.customsEntryNumber,
          assessedAt: assessedOn,
          submittedById: user.id,
        }),
      });
    });

    // If the car is already in somebody's inventory the passport takes the
    // milestone now; otherwise the inventory bridge replays it later from the
    // tracking history, so it is recorded either way.
    const mapped = STAGE_TO_PASSPORT.CUSTOMS_CLEARANCE;
    if (request.vehicleId && mapped) {
      await addVehicleEvent({
        vehicleId: request.vehicleId,
        type: mapped.type,
        title: mapped.title,
        notes: `Entry ${input.customsEntryNumber} · cleared by ${
          request.clearingAgent?.businessName ?? "agent"
        }`,
        occurredAt: assessedOn,
        verified: true,
        source: "import",
        recordedById: user.id,
      });
    }

    await prisma.notification
      .create({
        data: {
          userId: request.userId,
          type: "IMPORT",
          title: `${request.requestNumber}: cleared customs`,
          body: "Your car is through customs and ready to collect.",
          link: `/app/imports/${request.id}`,
        },
      })
      .catch(() => null);

    return NextResponse.json({
      cleared: true,
      actualDutyGhs: input.actualDutyGhs,
      estimatedDutyGhs: request.quotedDuty ? Number(request.quotedDuty) : null,
      customsEntryNumber: input.customsEntryNumber,
    });
  } catch (error) {
    console.error("[clearing:record]", error);
    return NextResponse.json({ error: "Could not record the clearance" }, { status: 500 });
  }
}
