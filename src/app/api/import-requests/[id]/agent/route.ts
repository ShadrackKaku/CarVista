import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { rateLimit, getClientId } from "@/lib/rate-limit";
import { assignClearingAgentSchema } from "@/lib/validations";
import { agentsForPort, assignBlockedReason, canAssignAgent } from "@/lib/clearing";

/**
 * GET /api/import-requests/[id]/agent — the agents this car could go to.
 *
 * Verified only, and filtered to the port the car is actually sitting at. An
 * unverified agent is never offered: the entire reason to engage a broker
 * through the platform rather than through a WhatsApp contact is that somebody
 * has seen the licence.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const request = await prisma.importRequest.findUnique({
    where: { id: params.id },
    select: { userId: true, stage: true, clearingAgentId: true },
  });
  if (!request) return NextResponse.json({ error: "Import not found" }, { status: 404 });
  if (request.userId !== user.id) {
    return NextResponse.json({ error: "This is not your import" }, { status: 403 });
  }

  const agents = await prisma.clearingAgent.findMany({
    where: { verified: true },
    select: {
      id: true,
      businessName: true,
      slug: true,
      city: true,
      ports: true,
      turnaroundDays: true,
      rating: true,
      reviewCount: true,
      verified: true,
      licenceNumber: true,
    },
    orderBy: [{ featured: "desc" }, { rating: "desc" }],
    take: 24,
  });

  // Tema is where the overwhelming majority of vehicles land, and the port is
  // not modelled on the request itself yet — so it is the default rather than
  // showing every agent in the country.
  const eligible = agentsForPort(agents, "Tema");

  return NextResponse.json({
    agents: eligible.map(({ licenceNumber, ...rest }) => ({
      ...rest,
      // The number itself is not the buyer's business; that it exists is.
      licensed: Boolean(licenceNumber),
    })),
    assignable: canAssignAgent(request.stage),
    blockedReason: assignBlockedReason(request.stage),
    currentAgentId: request.clearingAgentId,
  });
}

/**
 * POST — engage one of them.
 *
 * The buyer chooses, not an administrator. That is what makes this a
 * marketplace rather than a concierge service: agents win work by being
 * verified and fast, and the platform does not have to be in the middle of
 * every shipment.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const limit = await rateLimit(`assign-agent:${getClientId(req)}`, 20, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const parsed = assignClearingAgentSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Choose an agent" },
      { status: 400 },
    );
  }

  try {
    const request = await prisma.importRequest.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true, stage: true, requestNumber: true },
    });
    if (!request) return NextResponse.json({ error: "Import not found" }, { status: 404 });
    if (request.userId !== user.id) {
      return NextResponse.json({ error: "This is not your import" }, { status: 403 });
    }
    if (!canAssignAgent(request.stage)) {
      return NextResponse.json(
        { error: assignBlockedReason(request.stage) ?? "Not yet" },
        { status: 409 },
      );
    }

    // Re-checked server-side rather than trusted from the form: the list the
    // buyer saw could be minutes old, and an agent whose verification was
    // withdrawn in between must not be engageable.
    const agent = await prisma.clearingAgent.findUnique({
      where: { id: parsed.data.clearingAgentId },
      select: { id: true, businessName: true, verified: true, userId: true },
    });
    if (!agent || !agent.verified) {
      return NextResponse.json(
        { error: "That agent is not available. Choose another." },
        { status: 409 },
      );
    }

    await prisma.importRequest.update({
      where: { id: request.id },
      data: { clearingAgentId: agent.id },
    });

    await prisma.notification
      .create({
        data: {
          userId: agent.userId,
          type: "IMPORT",
          title: `New clearance: ${request.requestNumber}`,
          body: "A vehicle at the port has been assigned to you.",
          link: "/app/clearing",
        },
      })
      .catch(() => null);

    return NextResponse.json({ agent: { id: agent.id, businessName: agent.businessName } });
  } catch (error) {
    console.error("[imports:assign-agent]", error);
    return NextResponse.json({ error: "Could not engage that agent" }, { status: 500 });
  }
}
