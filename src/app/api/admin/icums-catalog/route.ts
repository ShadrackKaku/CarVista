import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { icumsCatalogSchema } from "@/lib/validations";

/**
 * POST /api/admin/icums-catalog — bulk upsert of ICUMS make/model catalogue
 * rows (admins only). Send pages of { makes: [{code,name}], models:
 * [{code,name,makeCode}] }; existing codes get their names refreshed. Models
 * whose make isn't in the catalogue yet are skipped and reported back, so
 * upload makes first.
 */
export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const parsed = icumsCatalogSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const { makes = [], models = [] } = parsed.data;

    let makesUpserted = 0;
    for (const m of makes) {
      await prisma.icumsMake.upsert({
        where: { code: m.code },
        create: { code: m.code, name: m.name },
        update: { name: m.name },
      });
      makesUpserted++;
    }

    // Models need their make present (FK) — skip unknown makes, report them.
    const knownMakes = new Set(
      (await prisma.icumsMake.findMany({ select: { code: true } })).map((m) => m.code),
    );
    const skipped: string[] = [];
    let modelsUpserted = 0;
    for (const m of models) {
      if (!knownMakes.has(m.makeCode)) {
        skipped.push(m.code);
        continue;
      }
      await prisma.icumsModel.upsert({
        where: { code: m.code },
        create: { code: m.code, name: m.name, makeCode: m.makeCode },
        update: { name: m.name, makeCode: m.makeCode },
      });
      modelsUpserted++;
    }

    return NextResponse.json({ success: true, makesUpserted, modelsUpserted, skipped });
  } catch (error) {
    console.error("[admin/icums-catalog]", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
