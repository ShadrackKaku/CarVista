import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { parseTaxList } from "@/lib/landed-cost";

const bodySchema = z.object({
  /** Raw text copied from the ICUMS "Tax List" tab. */
  text: z.string().min(3, "Paste the Tax List rows").max(20_000),
});

/**
 * POST /api/admin/duty-assessments/[id]/tax-lines — attach the itemised levy
 * breakdown from the ICUMS Tax List tab to an assessment (admins only).
 *
 * This is what lets us verify the formula calculator line-by-line against GRA's
 * own arithmetic, rather than trusting published rates that change without
 * notice.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const lines = parseTaxList(parsed.data.text);
    if (lines.length === 0) {
      return NextResponse.json(
        { error: "Couldn't read any levy lines from that." },
        { status: 400 },
      );
    }

    const existing = await prisma.dutyAssessment.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    await prisma.dutyAssessment.update({
      where: { id: params.id },
      // Prisma types Json input as an object/primitive union; an array of
      // plain records is valid JSON, so serialise through to satisfy it.
      data: { taxLines: JSON.parse(JSON.stringify(lines)) },
    });

    return NextResponse.json({ success: true, lines });
  } catch (err) {
    console.error("[admin/tax-lines]", err);
    return NextResponse.json({ error: "Couldn't save the breakdown" }, { status: 500 });
  }
}
