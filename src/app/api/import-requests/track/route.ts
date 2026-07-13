import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientId } from "@/lib/rate-limit";

/**
 * GET /api/import-requests/track?ref=IMP-XXXX
 * Public lookup of an import's status by its reference number.
 */
export async function GET(req: Request) {
  const limit = rateLimit(`track:${getClientId(req)}`, 30, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref")?.trim();
  if (!ref) {
    return NextResponse.json({ error: "Enter a reference number" }, { status: 400 });
  }

  try {
    const record = await prisma.importRequest.findUnique({
      where: { requestNumber: ref },
      include: { trackingEvents: { orderBy: { timestamp: "asc" } } },
    });
    if (!record) {
      return NextResponse.json({ found: false });
    }
    return NextResponse.json({
      found: true,
      ref: record.requestNumber,
      vehicle: `${record.year} ${record.make} ${record.model}`,
      origin: record.countryOfOrigin,
      stage: record.stage,
      estimatedArrival: record.estimatedArrival,
      events: record.trackingEvents.map((e) => ({
        stage: e.stage,
        title: e.title,
        description: e.description,
        location: e.location,
        timestamp: e.timestamp,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Lookup failed. Please try again." }, { status: 500 });
  }
}
