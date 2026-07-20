import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { rateLimit, getClientId } from "@/lib/rate-limit";
import { ownershipTransferSchema } from "@/lib/validations";
import { addVehicleEvent } from "@/lib/passport";

/**
 * POST — transfer a vehicle to another CarVista user.
 *
 * Only the current owner or an admin may transfer. The change reassigns the
 * listing's seller and writes a *verified* OWNERSHIP_TRANSFER event onto the
 * vehicle's passport, so the chain of custody is permanent and portable.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const limit = await rateLimit(`transfer:${getClientId(req)}`, 10, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  try {
    const parsed = ownershipTransferSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
      select: { id: true, sellerId: true, title: true },
    });
    if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

    const isAdmin = user.role === "ADMIN";
    const isOwner = vehicle.sellerId === user.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Only the owner can transfer this vehicle" }, { status: 403 });
    }

    const target = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: { id: true, name: true, email: true },
    });
    if (!target) {
      return NextResponse.json(
        { error: "No CarVista account with that email. Ask them to sign up first." },
        { status: 404 },
      );
    }
    if (target.id === vehicle.sellerId) {
      return NextResponse.json({ error: "They already own this vehicle." }, { status: 409 });
    }

    const previousOwnerId = vehicle.sellerId;

    // Reassign the listing.
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { sellerId: target.id },
    });

    // Record the transfer on the passport — verified, because the platform
    // executed it.
    await addVehicleEvent({
      vehicleId: vehicle.id,
      type: "OWNERSHIP_TRANSFER",
      title: "Ownership transferred",
      notes: parsed.data.note
        ? `Transferred to ${target.name ?? target.email}. ${parsed.data.note}`
        : `Transferred to ${target.name ?? target.email}.`,
      verified: true,
      source: "transfer",
      recordedById: user.id,
    });

    // Notify both parties.
    await prisma.notification
      .createMany({
        data: [
          {
            userId: target.id,
            type: "SYSTEM",
            title: "A vehicle was transferred to you",
            body: `You're now the owner of "${vehicle.title}" on CarVista.`,
            link: `/dashboard`,
          },
          ...(previousOwnerId
            ? [
                {
                  userId: previousOwnerId,
                  type: "SYSTEM" as const,
                  title: "Ownership transfer complete",
                  body: `"${vehicle.title}" was transferred to ${target.name ?? target.email}.`,
                  link: `/dashboard`,
                },
              ]
            : []),
        ],
      })
      .catch(() => null);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[vehicles:transfer]", error);
    return NextResponse.json({ error: "Could not transfer the vehicle" }, { status: 500 });
  }
}
