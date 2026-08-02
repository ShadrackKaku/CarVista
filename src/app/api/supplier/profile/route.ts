import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { supplierProfileSchema } from "@/lib/validations";

/**
 * PATCH /api/supplier/profile — edit your own supplier profile.
 *
 * Scoped to the caller's own row by `where: { userId }`, so there is no id in
 * the request that could point at somebody else's business. `verified`,
 * `featured` and `rating` are absent from the schema: those are things the
 * platform says about a supplier, not things a supplier says about itself.
 */
export async function PATCH(req: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  }

  const parsed = supplierProfileSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid profile" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  try {
    const existing = await prisma.supplier.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "You don't have a supplier profile yet" },
        { status: 404 },
      );
    }

    const supplier = await prisma.supplier.update({
      where: { userId: user.id },
      data: {
        businessName: d.businessName,
        description: d.description || null,
        categories: d.categories,
        minimumOrder: d.minimumOrder || null,
        servesRegions: d.servesRegions ?? [],
        leadTimeDays: d.leadTimeDays ?? null,
        phone: d.phone || null,
        whatsapp: d.whatsapp || null,
        website: d.website || null,
        city: d.city || null,
        region: d.region || null,
      },
    });
    return NextResponse.json({ supplier });
  } catch (error) {
    console.error("[supplier:profile:PATCH]", error);
    return NextResponse.json({ error: "Could not save your profile" }, { status: 500 });
  }
}
