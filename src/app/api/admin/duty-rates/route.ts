import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-guard";

/** GET — list configured duty-rate rows (admin). */
export async function GET() {
  const { error } = await requirePermission("duty:manage");
  if (error) return error;
  try {
    const rates = await prisma.dutyRate.findMany({ orderBy: { effectiveFrom: "desc" } });
    return NextResponse.json({ rates });
  } catch {
    return NextResponse.json({ rates: [] });
  }
}

/** POST — create / update a duty-rate configuration (admin). */
export async function POST(req: Request) {
  const { error } = await requirePermission("duty:manage");
  if (error) return error;
  try {
    const body = await req.json();
    const rate = await prisma.dutyRate.create({
      data: {
        category: body.category ?? "STANDARD",
        label: body.label ?? body.category ?? "Standard",
        bodyTypes: body.bodyTypes ?? [],
        fuelTypes: body.fuelTypes ?? [],
        importDutyRate: Number(body.importDutyRate),
        vatRate: Number(body.vatRate),
        nhilRate: Number(body.nhilRate),
        getfundRate: Number(body.getfundRate),
        ecowasLevyRate: Number(body.ecowasLevyRate),
        auLevyRate: Number(body.auLevyRate),
        eximLevyRate: Number(body.eximLevyRate),
        specialImportLevyRate: Number(body.specialImportLevyRate),
        examinationFee: Number(body.examinationFee),
        networkCharge: Number(body.networkCharge),
      },
    });
    return NextResponse.json({ rate }, { status: 201 });
  } catch (error) {
    console.error("[admin:duty-rates]", error);
    return NextResponse.json({ error: "Failed to save rates" }, { status: 500 });
  }
}
