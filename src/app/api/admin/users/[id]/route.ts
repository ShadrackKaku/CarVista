import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import type { UserStatus } from "@prisma/client";

const ALLOWED: UserStatus[] = ["ACTIVE", "SUSPENDED", "PENDING"];

/** PATCH — change a user's account status. Body: { status: UserStatus } */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const body = await req.json().catch(() => ({}));
    const status = body.status as UserStatus;

    if (!ALLOWED.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (params.id === guard.user.id) {
      return NextResponse.json({ error: "You can't change your own status" }, { status: 400 });
    }

    await prisma.user.update({ where: { id: params.id }, data: { status } });
    return NextResponse.json({ success: true, status });
  } catch (e) {
    console.error("[admin:users:PATCH]", e);
    return NextResponse.json({ error: "Could not update user" }, { status: 500 });
  }
}
