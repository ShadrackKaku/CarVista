import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { partListingSchema } from "@/lib/validations";
import { resolvePartCategoryId } from "@/lib/parts";
import { Prisma } from "@prisma/client";

/**
 * PATCH /api/parts/[id] — edit a part listing.
 *
 * Only the part's seller or an admin may edit. Fields are re-validated with the
 * same schema as creation; images are replaced wholesale from the submitted set.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  try {
    const part = await prisma.part.findUnique({
      where: { id: params.id },
      select: { id: true, sellerId: true },
    });
    if (!part) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    const isAdmin = user.role === "ADMIN";
    if (part.sellerId !== user.id && !isAdmin) {
      return NextResponse.json({ error: "You can only edit your own listings." }, { status: 403 });
    }

    const parsed = partListingSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const categoryId = await resolvePartCategoryId(d.categorySlug);

    // Replace the image set, then update scalars — in one transaction.
    await prisma.$transaction([
      prisma.partImage.deleteMany({ where: { partId: part.id } }),
      prisma.part.update({
        where: { id: part.id },
        data: {
          name: d.name,
          description: d.description || null,
          categoryId,
          brand: d.brand || null,
          oemNumber: d.oemNumber || null,
          partNumber: d.partNumber || null,
          condition: d.condition,
          price: new Prisma.Decimal(d.price),
          discountPrice: d.discountPrice != null ? new Prisma.Decimal(d.discountPrice) : null,
          stock: d.stock,
          sku: d.sku || null,
          compatibleMakes: d.compatibleMakes ?? [],
          compatibleModels: d.compatibleModels ?? [],
          yearFrom: d.yearFrom ?? null,
          yearTo: d.yearTo ?? null,
          fitmentPosition: d.fitmentPosition || null,
          images:
            d.images && d.images.length
              ? { create: d.images.map((url, i) => ({ url, isPrimary: i === 0, order: i })) }
              : undefined,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[parts:PATCH]", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}
