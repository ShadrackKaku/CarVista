import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { rateLimit, getClientId } from "@/lib/rate-limit";
import { addVehicleEvent } from "@/lib/passport";
import { takeIntoInventorySchema } from "@/lib/validations";
import {
  canEnterInventory,
  conditionForImport,
  inventoryBlockedReason,
  landedCostOf,
  passportBackfill,
  vehicleTitleFor,
} from "@/lib/import-to-inventory";
import { generateReference, slugify } from "@/lib/utils";

/**
 * POST /api/import-requests/[id]/inventory — the bridge.
 *
 * A cleared import becomes a vehicle the owner actually holds. Everything the
 * importer typed when they listed the stock comes across — make, model, trim,
 * mileage, fuel, transmission, body, engine, colour, drivetrain, features and
 * every photograph — so the person who just spent two months and several
 * hundred thousand cedis importing a car does not then have to describe it from
 * scratch to sell it.
 *
 * What crosses, and why it matters:
 *
 *  - The **chassis number becomes the VIN**, which is what the passport is
 *    keyed on. Without it every imported car would get a synthesised identity
 *    and the history could never be matched to the physical vehicle.
 *  - The **real tracking dates** are replayed onto the passport, so the
 *    timeline shows the journey that happened rather than starting the car's
 *    life at the moment it was listed.
 *  - `importStatus` is set to CLEARED — earned, not claimed. We watched it
 *    clear.
 *
 * The vehicle is always created as a DRAFT. Publishing is a separate, deliberate
 * act on the listing form, because price is the one thing we genuinely cannot
 * know for them, and a car that appeared on the marketplace at its landed cost
 * without anyone confirming it would be a listing nobody meant to make.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const limit = await rateLimit(`inventory:${getClientId(req)}`, 20, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const parsed = takeIntoInventorySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { intent } = parsed.data;

  try {
    const request = await prisma.importRequest.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        stage: true,
        vehicleId: true,
        requestNumber: true,
        make: true,
        model: true,
        year: true,
        fuelType: true,
        transmission: true,
        color: true,
        countryOfOrigin: true,
        auctionSource: true,
        notes: true,
        quotedTotal: true,
        quotedCif: true,
        quotedDuty: true,
        quotedShipping: true,
        actualDutyGhs: true,
        clearedById: true,
        listing: {
          select: {
            make: true,
            model: true,
            trim: true,
            year: true,
            mileage: true,
            fuelType: true,
            transmission: true,
            bodyType: true,
            engineSize: true,
            color: true,
            drivetrain: true,
            description: true,
            features: true,
            countryOfOrigin: true,
            auctionSource: true,
            auctionGrade: true,
            chassisNumber: true,
            images: { select: { url: true, alt: true, position: true } },
          },
        },
        trackingEvents: {
          select: { stage: true, title: true, description: true, location: true, timestamp: true },
        },
      },
    });

    if (!request) return NextResponse.json({ error: "Import not found" }, { status: 404 });

    // Ownership before anything else — an import id is guessable, and this
    // endpoint mints a vehicle belonging to whoever calls it.
    if (request.userId !== user.id) {
      return NextResponse.json({ error: "This is not your import" }, { status: 403 });
    }

    if (request.vehicleId) {
      // Not an error worth alarming anyone about: they pressed it twice, or
      // came back to a stale tab. Send them to the car they already have.
      const existing = await prisma.vehicle.findUnique({
        where: { id: request.vehicleId },
        select: { id: true, slug: true, title: true, status: true },
      });
      return NextResponse.json(
        { error: "This car is already in your inventory", vehicle: existing },
        { status: 409 },
      );
    }

    if (!canEnterInventory(request.stage)) {
      return NextResponse.json(
        { error: inventoryBlockedReason(request.stage) ?? "This car is not ready yet" },
        { status: 409 },
      );
    }

    // Stock listings carry a full description; a free-form request ("find me a
    // 2019 Harrier") carries only what the buyer knew to ask for. Both must
    // work, so the listing is preferred field by field rather than wholesale.
    const stock = request.listing;
    const make = stock?.make ?? request.make;
    const model = stock?.model ?? request.model;
    const year = stock?.year ?? request.year;

    const title = vehicleTitleFor({ year, make, model, trim: stock?.trim });
    const slug = `${slugify(title)}-${generateReference("").slice(1, 6).toLowerCase()}`;

    const landedCost = landedCostOf({
      quotedTotal: request.quotedTotal ? Number(request.quotedTotal) : null,
      quotedCif: request.quotedCif ? Number(request.quotedCif) : null,
      quotedDuty: request.quotedDuty ? Number(request.quotedDuty) : null,
      quotedShipping: request.quotedShipping ? Number(request.quotedShipping) : null,
      // The bill, not the estimate, once customs has spoken.
      actualDuty: request.actualDutyGhs ? Number(request.actualDutyGhs) : null,
    });

    const dealer = await prisma.dealer.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    const vehicle = await prisma.$transaction(async (tx) => {
      // The marketplace keys on Brand/VehicleModel rows; import stock carries
      // free text. Resolve rather than reject, so a make we have not seen
      // before does not strand a car that is physically sitting in Tema.
      const brand =
        (await tx.brand.findFirst({
          where: { OR: [{ name: make }, { slug: slugify(make) }] },
          select: { id: true },
        })) ??
        (await tx.brand.create({
          data: { name: make, slug: slugify(make) },
          select: { id: true },
        }));

      const vehicleModel = model
        ? await tx.vehicleModel.upsert({
            where: { brandId_slug: { brandId: brand.id, slug: slugify(model) } },
            create: {
              brandId: brand.id,
              name: model,
              slug: slugify(model),
              ...(stock?.bodyType ? { bodyType: stock.bodyType } : {}),
            },
            update: {},
            select: { id: true },
          })
        : null;

      const created = await tx.vehicle.create({
        data: {
          slug,
          title,
          brandId: brand.id,
          modelId: vehicleModel?.id ?? null,
          year,
          // A starting figure, not an asking price. The owner sets the real one
          // on the listing form, where they are shown what it actually cost.
          price: new Prisma.Decimal(landedCost ?? 0),
          mileage: stock?.mileage ?? 0,
          fuelType: stock?.fuelType ?? request.fuelType ?? "PETROL",
          transmission: stock?.transmission ?? request.transmission ?? "AUTOMATIC",
          bodyType: stock?.bodyType ?? "SUV",
          engineSize: stock?.engineSize ?? null,
          color: stock?.color ?? request.color ?? null,
          drivetrain: stock?.drivetrain ?? null,
          condition: conditionForImport({ year, mileage: stock?.mileage }),
          // The chassis number is the car's real identity and the key the
          // passport hangs on. Carrying it across is what lets a buyer match
          // the history to the metal in front of them.
          vin: stock?.chassisNumber ?? null,
          auctionGrade: stock?.auctionGrade ?? null,
          description: stock?.description ?? request.notes ?? null,
          features: stock?.features ?? [],
          countryOfOrigin: stock?.countryOfOrigin ?? request.countryOfOrigin,
          // Not a claim — we tracked this car through customs ourselves.
          importStatus: "CLEARED",
          // Draft either way. "Keep" stays a draft forever; "sell" becomes
          // ACTIVE when they publish it from the listing form.
          status: "DRAFT",
          sellerId: user.id,
          dealerId: dealer?.id ?? null,
          images: stock?.images.length
            ? {
                create: stock.images
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map((image, index) => ({
                    url: image.url,
                    alt: image.alt,
                    isPrimary: index === 0,
                    order: index,
                  })),
              }
            : undefined,
        },
        select: { id: true, slug: true, title: true, status: true },
      });

      await tx.importRequest.update({
        where: { id: request.id },
        data: { vehicleId: created.id },
      });

      return created;
    });

    // Replay the shipment onto the passport. Outside the transaction on
    // purpose: the passport helpers swallow their own errors, and a car that
    // exists with a thin history is recoverable, whereas losing the vehicle
    // because one event failed to write is not.
    const backfill = passportBackfill(request.trackingEvents, {
      clearedById: request.clearedById,
    });
    for (const event of backfill) {
      await addVehicleEvent({
        vehicleId: vehicle.id,
        type: event.type,
        title: event.title,
        notes: event.notes,
        occurredAt: event.occurredAt,
        verified: true,
        source: "import",
        // Not the person crossing the bridge: a replayed clearance belongs to
        // the licensed broker who recorded it, or to nobody at all.
        recordedById: event.recordedById,
      });
    }

    // Where the car came from, in one line, even when tracking was sparse.
    const origin = [stock?.auctionSource ?? request.auctionSource, request.countryOfOrigin]
      .filter(Boolean)
      .join(", ");
    await addVehicleEvent({
      vehicleId: vehicle.id,
      type: "NOTE",
      title: "Added to inventory",
      notes: origin ? `Imported via ${origin} · ${request.requestNumber}` : request.requestNumber,
      verified: true,
      source: "import",
      recordedById: user.id,
    });

    return NextResponse.json(
      {
        vehicle,
        intent,
        landedCost,
        passportEvents: backfill.length + 1,
        // The client decides where to send them, but the server knows which
        // destination makes sense for the choice they made.
        next:
          intent === "SELL"
            ? `/app/marketplace/listings/${vehicle.slug}/edit`
            : `/app/marketplace/listings`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[imports:inventory]", error);
    return NextResponse.json({ error: "Could not add this car to your inventory" }, { status: 500 });
  }
}
