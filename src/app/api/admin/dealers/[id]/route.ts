import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-guard";

/** PATCH — verify / un-verify a dealer. Body: { verified: boolean } */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requirePermission("dealers:manage");
  if (error) return error;

  try {
    const body = await req.json().catch(() => ({}));
    const verified = Boolean(body.verified);
    await prisma.dealer.update({ where: { id: params.id }, data: { verified } });
    return NextResponse.json({ success: true, verified });
  } catch (e) {
    console.error("[admin:dealers:PATCH]", e);
    return NextResponse.json({ error: "Could not update dealer" }, { status: 500 });
  }
}
