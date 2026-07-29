import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Must read the DB per request (admin imports extend the catalogue between
// deploys) — without this, Next statically bakes the list at build time.
export const dynamic = "force-dynamic";

/** GET /api/icums/makes — the ICUMS vehicle-make catalogue (code + name),
 *  for the cascading pickers. Public; changes rarely, so cacheable. */
export async function GET() {
  try {
    const makes = await prisma.icumsMake.findMany({
      orderBy: { name: "asc" },
      select: { code: true, name: true },
    });
    return NextResponse.json(
      { makes },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch {
    // No DB (or catalogue not migrated yet): the form falls back to free text.
    return NextResponse.json({ makes: [] });
  }
}
