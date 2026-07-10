import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { vehicleListingSchema } from "@/lib/validations";
import { slugify, generateReference } from "@/lib/utils";
import { Prisma } from "@prisma/client";

/** GET /api/vehicles — search & filter listings. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(48, Number(searchParams.get("pageSize") ?? 24));

  const where: Prisma.VehicleWhereInput = { status: "ACTIVE" };
  const q = searchParams.get("q");
  const brand = searchParams.get("brand");
  const bodyType = searchParams.get("bodyType");
  const condition = searchParams.get("condition");
  const fuelType = searchParams.get("fuelType");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minYear = searchParams.get("minYear");
  const maxYear = searchParams.get("maxYear");

  if (q) where.title = { contains: q, mode: "insensitive" };
  if (brand) where.brand = { name: brand };
  if (bodyType) where.bodyType = bodyType as Prisma.VehicleWhereInput["bodyType"];
  if (condition) where.condition = condition as Prisma.VehicleWhereInput["condition"];
  if (fuelType) where.fuelType = fuelType as Prisma.VehicleWhereInput["fuelType"];
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) (where.price as Prisma.DecimalFilter).gte = new Prisma.Decimal(minPrice);
    if (maxPrice) (where.price as Prisma.DecimalFilter).lte = new Prisma.Decimal(maxPrice);
  }
  if (minYear || maxYear) {
    where.year = {};
    if (minYear) (where.year as Prisma.IntFilter).gte = Number(minYear);
    if (maxYear) (where.year as Prisma.IntFilter).lte = Number(maxYear);
  }

  const sort = searchParams.get("sort");
  const orderBy: Prisma.VehicleOrderByWithRelationInput =
    sort === "price-asc"
      ? { price: "asc" }
      : sort === "price-desc"
        ? { price: "desc" }
        : sort === "year-desc"
          ? { year: "desc" }
          : { createdAt: "desc" };

  try {
    const [items, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          brand: true,
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { businessName: true, slug: true, verified: true } },
        },
      }),
      prisma.vehicle.count({ where }),
    ]);
    return NextResponse.json({ items, total, page, pageSize });
  } catch (error) {
    console.error("[vehicles:GET]", error);
    return NextResponse.json({ error: "Failed to load vehicles" }, { status: 500 });
  }
}

/** POST /api/vehicles — create a listing (dealers & customers). */
export async function POST(req: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to list a vehicle" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = vehicleListingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const slug = `${slugify(d.title)}-${generateReference("").slice(1, 6).toLowerCase()}`;

    const vehicle = await prisma.vehicle.create({
      data: {
        slug,
        title: d.title,
        brandId: d.brandId,
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
        description: d.description || null,
        sellerId: user.id,
        status: user.role === "DEALER" ? "ACTIVE" : "PENDING",
      },
    });

    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (error) {
    console.error("[vehicles:POST]", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
