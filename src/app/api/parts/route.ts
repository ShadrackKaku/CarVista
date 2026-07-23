import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { partListingSchema } from "@/lib/validations";
import { resolvePartCategoryId } from "@/lib/parts";
import { sanitizeRichHtml } from "@/lib/sanitize";
import { slugify, generateReference } from "@/lib/utils";
import { Prisma } from "@prisma/client";

/** POST /api/parts — list a new part (parts sellers & admins go live instantly). */
export async function POST(req: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to list a part" }, { status: 401 });
  }

  try {
    const parsed = partListingSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const d = parsed.data;

    const categoryId = await resolvePartCategoryId(d.categorySlug);
    const slug = `${slugify(d.name)}-${generateReference("").slice(1, 6).toLowerCase()}`;

    // Link to the seller's storefront if they have one.
    const store = await prisma.partsStore.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    const part = await prisma.part.create({
      data: {
        slug,
        name: d.name,
        description: d.description ? sanitizeRichHtml(d.description) : null,
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
        sellerId: user.id,
        storeId: store?.id ?? null,
        status: user.role === "PARTS_SELLER" || user.role === "ADMIN" ? "ACTIVE" : "PENDING",
        images:
          d.images && d.images.length
            ? { create: d.images.map((url, i) => ({ url, isPrimary: i === 0, order: i })) }
            : undefined,
      },
    });

    return NextResponse.json({ part }, { status: 201 });
  } catch (error) {
    console.error("[parts:POST]", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
