import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { rateLimit, getClientId } from "@/lib/rate-limit";
import { importListingSchema } from "@/lib/validations";
import { isImporter } from "@/lib/roles";
import { slugify } from "@/lib/utils";

/**
 * POST — publish a car an importer has access to.
 *
 * The importer is resolved from the session, never from the body: taking an
 * `importerId` from the client would let any signed-in account publish stock
 * under someone else's name and collect reservation fees against it.
 *
 * New listings start as DRAFT. Publishing is a separate action, so a
 * half-finished car with no price never appears on a browse page.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  if (!isImporter(user.role)) {
    return NextResponse.json({ error: "Importers only" }, { status: 403 });
  }

  const limit = await rateLimit(`import-listing:${getClientId(req)}`, 30, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const importer = await prisma.importer.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!importer) {
    return NextResponse.json(
      { error: "Your importer profile isn't set up yet." },
      { status: 409 },
    );
  }

  const parsed = importListingSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid listing" },
      { status: 400 },
    );
  }
  const input = parsed.data;

  try {
    const slug = await uniqueListingSlug(`${input.year}-${input.make}-${input.model}`);
    const listing = await prisma.importListing.create({
      data: {
        importerId: importer.id,
        slug,
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
        features: [],
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
        status: "DRAFT",
        images: input.images?.length
          ? { create: input.images.map((url, position) => ({ url, position })) }
          : undefined,
      },
      select: { id: true, slug: true },
    });
    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error("[import-listings:create]", error);
    return NextResponse.json({ error: "Could not save the listing" }, { status: 500 });
  }
}

/** Slugs are unique; a collision gets a suffix rather than an error. */
async function uniqueListingSlug(base: string): Promise<string> {
  const root = slugify(base) || "import-listing";
  for (let i = 0; i < 12; i += 1) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const clash = await prisma.importListing.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}
