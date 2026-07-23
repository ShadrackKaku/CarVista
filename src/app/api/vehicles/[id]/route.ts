import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { vehicleListingSchema } from "@/lib/validations";
import { sanitizeRichHtml } from "@/lib/sanitize";
import { slugify } from "@/lib/utils";
import { Prisma } from "@prisma/client";

/**
 * PATCH /api/vehicles/[id] — edit a listing.
 *
 * Only the vehicle's seller or an admin may edit. Fields are re-validated with
 * the same schema as creation; images/video are replaced wholesale from the
 * submitted set. The listing's status is left untouched (editing doesn't
 * re-trigger review).
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
      select: { id: true, sellerId: true },
    });
    if (!vehicle) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    const isAdmin = user.role === "ADMIN";
    if (vehicle.sellerId !== user.id && !isAdmin) {
      return NextResponse.json({ error: "You can only edit your own listings." }, { status: 403 });
    }

    const parsed = vehicleListingSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const d = parsed.data;

    // The form submits the brand NAME; resolve (or create) the Brand record.
    const brand =
      (await prisma.brand.findFirst({
        where: { OR: [{ id: d.brandId }, { name: d.brandId }, { slug: slugify(d.brandId) }] },
      })) ?? (await prisma.brand.create({ data: { name: d.brandId, slug: slugify(d.brandId) } }));

    const videoSource: "YOUTUBE" | "VIMEO" | "UPLOAD" | null = d.videoUrl
      ? /youtube|youtu\.be/i.test(d.videoUrl)
        ? "YOUTUBE"
        : /vimeo/i.test(d.videoUrl)
          ? "VIMEO"
          : "UPLOAD"
      : null;

    // Replace the media sets, then update scalars — in one transaction.
    await prisma.$transaction([
      prisma.vehicleImage.deleteMany({ where: { vehicleId: vehicle.id } }),
      prisma.vehicleVideo.deleteMany({ where: { vehicleId: vehicle.id } }),
      prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          title: d.title,
          brandId: brand.id,
          modelId: d.modelId || null,
          year: d.year,
          price: new Prisma.Decimal(d.price),
          mileage: d.mileage,
          fuelType: d.fuelType,
          transmission: d.transmission,
          engineSize: d.engineSize ?? null,
          bodyType: d.bodyType,
          condition: d.condition,
          color: d.color || null,
          city: d.city || null,
          region: d.region || null,
          location: d.city || null,
          description: d.description ? sanitizeRichHtml(d.description) : null,
          images:
            d.images && d.images.length
              ? { create: d.images.map((url, i) => ({ url, isPrimary: i === 0, order: i })) }
              : undefined,
          videos:
            d.videoUrl && videoSource
              ? { create: [{ url: d.videoUrl, source: videoSource, category: "WALKAROUND" }] }
              : undefined,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[vehicles:PATCH]", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}
