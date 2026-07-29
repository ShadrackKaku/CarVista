import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/icums/models?make=00042 — the ICUMS models for one make,
 *  for the cascading pickers. Public; cacheable per make. */
export async function GET(req: Request) {
  const makeCode = new URL(req.url).searchParams.get("make") ?? "";
  if (!/^\d{5}$/.test(makeCode)) {
    return NextResponse.json({ error: "Pass a 5-digit make code" }, { status: 400 });
  }
  try {
    const models = await prisma.icumsModel.findMany({
      where: { makeCode },
      orderBy: { name: "asc" },
      select: { code: true, name: true },
    });
    return NextResponse.json(
      { models },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch {
    return NextResponse.json({ models: [] });
  }
}
