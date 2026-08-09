import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isImporter } from "@/lib/roles";
import { importListingSchema, importListingStatusSchema } from "@/lib/validations";
import { holdingWhere } from "@/lib/reservations";

/**
 * PATCH — edit a listing, or publish/archive it.
 *
 * Ownership is enforced by scoping the update to the importer resolved from the
 * session. A listing id alone is not authority to change it.
 *
 * Quantity may not drop below the units currently held: a buyer who has paid to
 * hold a unit must not lose it because the importer edited the number down.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  if (!isImporter(user.role)) {
    return NextResponse.json({ error: "Importers only" }, { status: 403 });
  }

  const importer = await prisma.importer.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!importer) return NextResponse.json({ error: "No importer profile" }, { status: 409 });

  const listing = await prisma.importListing.findFirst({
    where: { id: params.id, importerId: importer.id },
    select: { id: true, status: true },
  });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  // Status-only change: publish or archive.
  const statusOnly = importListingStatusSchema.safeParse(body);
  if (statusOnly.success && Object.keys(body).length === 1) {
    // Taking a car off the market while somebody is holding a unit of it would
    // strand a buyer who has paid GH₵500 and is in the middle of arranging the
    // FOB transfer. Their hold runs out on its own within two working days;
    // until then the importer has to honour it.
    if (statusOnly.data.status !== "ACTIVE") {
      const holding = await prisma.importReservation.count({
        where: { listingId: listing.id, ...holdingWhere() },
      });
      if (holding > 0) {
        return NextResponse.json(
          {
            error: `${holding} buyer${holding === 1 ? " is" : "s are"} holding a unit of this listing. You can archive it once their hold runs out.`,
          },
          { status: 409 },
        );
      }
    }

    await prisma.importListing.update({
      where: { id: listing.id },
      data: { status: statusOnly.data.status },
    });
    return NextResponse.json({ ok: true, status: statusOnly.data.status });
  }

  const parsed = importListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid listing" },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // Counted through the shared predicate so a hold that has already lapsed —
  // but which no sweep has flipped yet — does not block the importer from
  // correcting the quantity.
  const held = await prisma.importReservation.count({
    where: { listingId: listing.id, ...holdingWhere() },
  });
  if (input.quantity < held) {
    return NextResponse.json(
      {
        error: `${held} unit${held === 1 ? " is" : "s are"} currently reserved, so quantity cannot go below ${held}.`,
      },
      { status: 409 },
    );
  }

  try {
    await prisma.importListing.update({
      where: { id: listing.id },
      data: {
        title: input.title,
        make: input.make,
        model: input.model,
        trim: input.trim || null,
        year: input.year,
        mileage: input.mileage ?? null,
        fuelType: input.fuelType,
        transmission: input.transmission,
        bodyType: input.bodyType,
        engineSize: input.engineSize ?? null,
        color: input.color || null,
        drivetrain: input.drivetrain || null,
        description: input.description || null,
        countryOfOrigin: input.countryOfOrigin,
        portOfLoading: input.portOfLoading || null,
        auctionSource: input.auctionSource || null,
        auctionGrade: input.auctionGrade || null,
        chassisNumber: input.chassisNumber || null,
        fobAmount: input.fobAmount,
        fobCurrency: input.fobCurrency,
        fxRateToGhs: input.fxRateToGhs ?? null,
        serviceFeeGhs: input.serviceFeeGhs ?? null,
        freightGhs: input.freightGhs ?? null,
        quantity: input.quantity,
        etaDays: input.etaDays ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[import-listings:update]", error);
    return NextResponse.json({ error: "Could not save the listing" }, { status: 500 });
  }
}
