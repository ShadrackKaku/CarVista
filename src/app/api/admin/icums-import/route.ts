import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { parseIcumsTable } from "@/lib/icums-paste";

const importSchema = z.object({
  /** Raw text copied from the ICUMS results table. */
  text: z.string().min(10, "Paste the ICUMS results table").max(200_000),
  icumsMakeCode: z
    .string()
    .regex(/^\d{5}$/)
    .optional(),
  icumsModelCode: z
    .string()
    .regex(/^\d{5}$/)
    .optional(),
  /** Preview only — parse and report without writing. */
  dryRun: z.boolean().optional(),
});

const norm = (s: string) => s.trim().toUpperCase();

/**
 * POST /api/admin/icums-import — import assessments pasted from the public
 * ICUMS used-vehicle checker (admins only).
 *
 * An operator searches a model on the portal, copies the results table and
 * pastes it here: we parse the rows, store each as a VERIFIED observation
 * (admin-entered, straight from the official source) and upsert the vehicle's
 * HDV into the reference table. Re-importing the same table is safe — rows are
 * matched on their natural key and skipped.
 */
export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const parsed = importSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const { text, icumsMakeCode, icumsModelCode, dryRun } = parsed.data;
    const result = parseIcumsTable(text);

    if (dryRun) {
      return NextResponse.json({
        preview: result.rows,
        parseErrors: result.errors,
        skipped: result.skipped,
      });
    }
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No usable rows found in that paste.", parseErrors: result.errors },
        { status: 400 },
      );
    }

    let imported = 0;
    let duplicates = 0;
    let hdvUpserted = 0;

    for (const row of result.rows) {
      const assessedAt = row.assessmentDate ? new Date(row.assessmentDate) : null;

      // Natural key for a list-view row (no chassis is shown there).
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
      if (existing) {
        duplicates++;
        continue;
      }

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
          icumsMakeCode: icumsMakeCode ?? null,
          icumsModelCode: icumsModelCode ?? null,
          // Read straight off the official portal by an admin — trusted on entry.
          source: "ICUMS_LOOKUP",
          status: "VERIFIED",
          documentUrls: [],
        },
      });
      imported++;

      // Keep the HDV reference current: latest observation wins, count grows.
      if (row.hdv != null && row.hdv > 0) {
        const key = {
          make: norm(row.make),
          model: norm(row.model),
          year: row.yearOfManufacture,
          trim: row.trimLevel ? norm(row.trimLevel) : "",
        };
        const ref = await prisma.hdvReference.findUnique({
          where: { make_model_year_trim: key },
          select: { id: true, observationCount: true, lastObservedAt: true },
        });
        const observedAt = assessedAt ?? new Date();
        if (!ref) {
          await prisma.hdvReference.create({
            data: {
              ...key,
              hdv: row.hdv,
              currency: row.currency,
              hsCode: row.hsCode,
              icumsMakeCode: icumsMakeCode ?? null,
              icumsModelCode: icumsModelCode ?? null,
              lastObservedAt: observedAt,
            },
          });
        } else {
          // Only let a NEWER sighting move the value; older ones just add weight.
          const isNewer = observedAt >= ref.lastObservedAt;
          await prisma.hdvReference.update({
            where: { id: ref.id },
            data: {
              observationCount: ref.observationCount + 1,
              ...(isNewer
                ? {
                    hdv: row.hdv,
                    currency: row.currency,
                    hsCode: row.hsCode ?? undefined,
                    lastObservedAt: observedAt,
                  }
                : {}),
            },
          });
        }
        hdvUpserted++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      duplicates,
      hdvUpserted,
      parseErrors: result.errors,
      skipped: result.skipped,
    });
  } catch (err) {
    console.error("[admin/icums-import]", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
