import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { importerProfileSchema } from "@/lib/validations";

/**
 * PATCH /api/importer/profile — edit your own importer profile.
 *
 * Scoped to the caller's own row by `where: { userId }`, so there is no id in
 * the request that could point at another importer's business. `verified` and
 * `featured` are absent from the schema: a buyer decides whether to wire the
 * FOB partly on that badge, so it has to stay something the platform grants.
 */
export async function PATCH(req: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  }

  const parsed = importerProfileSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid profile" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  try {
    const existing = await prisma.importer.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "You don't have an importer profile yet" },
        { status: 404 },
      );
    }

    const importer = await prisma.importer.update({
      where: { userId: user.id },
      data: {
        businessName: d.businessName,
        description: d.description || null,
        sourceMarkets: d.sourceMarkets,
        leadTimeDays: d.leadTimeDays ?? null,
        phone: d.phone || null,
        whatsapp: d.whatsapp || null,
        email: d.email || null,
        website: d.website || null,
        city: d.city || null,
        region: d.region || null,
      },
    });
    return NextResponse.json({ importer });
  } catch (error) {
    console.error("[importer:profile:PATCH]", error);
    return NextResponse.json({ error: "Could not save your profile" }, { status: 500 });
  }
}
