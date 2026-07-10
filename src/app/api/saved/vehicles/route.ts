import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { vehicleId } = await req.json();
    if (!vehicleId) return NextResponse.json({ error: "vehicleId required" }, { status: 400 });
    await prisma.savedVehicle.upsert({
      where: { userId_vehicleId: { userId: user.id, vehicleId } },
      update: {},
      create: { userId: user.id, vehicleId },
    });
    return NextResponse.json({ success: true, saved: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { vehicleId } = await req.json();
    await prisma.savedVehicle.deleteMany({ where: { userId: user.id, vehicleId } });
    return NextResponse.json({ success: true, saved: false });
  } catch {
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
