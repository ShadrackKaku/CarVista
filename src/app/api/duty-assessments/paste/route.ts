import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { parseIcumsTable } from "@/lib/icums-paste";
import { rateLimit, getClientId } from "@/lib/rate-limit";

const pasteSchema = z.object({
  text: z.string().min(10, "Paste the rows you saw on ICUMS").max(50_000),
});

/**
 * POST /api/duty-assessments/paste — public paste-back from the "check this on
 * ICUMS" loop. A visitor verifies our estimate against the official portal and
 * hands the rows back; they land as PENDING community submissions for an admin
 * to verify, exactly like an uploaded tax bill. Never trusted on entry.
 */
export async function POST(req: Request) {
  const limit = await rateLimit(`duty-paste:${getClientId(req)}`, 5, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many submissions. Try again later." }, { status: 429 });
  }

  try {
    const parsed = pasteSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const result = parseIcumsTable(parsed.data.text);
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Couldn't read any rows from that. Copy the results table and try again." },
        { status: 400 },
      );
    }

    const user = await getCurrentUser().catch(() => null);
    // Keep public submissions modest — this is a contribution, not a bulk load.
    const rows = result.rows.slice(0, 20);

    let created = 0;
    for (const row of rows) {
      const assessedAt = row.assessmentDate ? new Date(row.assessmentDate) : null;
      const existing = await prisma.dutyAssessment.findFirst({
        where: {
          make: row.make,
          modelType: row.model,
          yearOfManufacture: row.yearOfManufacture,
          trimLevel: row.trimLevel,
          assessedAt,
          totalTax: row.totalTax,
        },
        select: { id: true },
      });
      if (existing) continue;

      await prisma.dutyAssessment.create({
        data: {
          make: row.make,
          modelType: row.model,
          trimLevel: row.trimLevel,
          yearOfManufacture: row.yearOfManufacture,
          originCode: row.originCode,
          hsCode: row.hsCode,
          hdv: row.hdv ?? null,
          hdvCurrency: row.currency,
          cifNcy: row.cifNcy ?? null,
          totalTax: row.totalTax,
          exchangeRate: row.exchangeRate ?? null,
          assessedAt,
          source: "COMMUNITY",
          status: "PENDING",
          documentUrls: [],
          submittedById: user?.id ?? null,
        },
      });
      created++;
    }

    return NextResponse.json({ success: true, received: rows.length, created });
  } catch (error) {
    console.error("[duty-assessments/paste]", error);
    return NextResponse.json({ error: "Couldn't save that. Please try again." }, { status: 500 });
  }
}
