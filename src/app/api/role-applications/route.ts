import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { roleApplicationSchema } from "@/lib/validations";

/** GET /api/role-applications — the caller's own applications, newest first. */
export async function GET() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  }

  try {
    const applications = await prisma.roleApplication.findMany({
      where: { userId: user.id },
      orderBy: { submittedAt: "desc" },
    });
    return NextResponse.json({ applications });
  } catch (error) {
    console.error("[role-applications:GET]", error);
    return NextResponse.json({ error: "Could not load your applications" }, { status: 500 });
  }
}

/**
 * POST /api/role-applications — apply for a specialised role.
 *
 * The schema restricts `requestedRole` to the applicable set, so ADMIN and
 * SUPER_ADMIN cannot be requested here whatever the body says, and `status` is
 * not a field at all — a submission is always PENDING until a reviewer moves it.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Please sign in to apply" }, { status: 401 });
  }

  const parsed = roleApplicationSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid application" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  if (user.role === d.requestedRole) {
    return NextResponse.json({ error: "You already have this role" }, { status: 409 });
  }

  try {
    const application = await prisma.roleApplication.create({
      data: {
        userId: user.id,
        requestedRole: d.requestedRole,
        businessName: d.businessName || null,
        businessRegNumber: d.businessRegNumber || null,
        phone: d.phone || null,
        city: d.city || null,
        region: d.region || null,
        message: d.message || null,
        documentUrls: d.documentUrls ?? [],
      },
    });
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    // A partial unique index allows one PENDING row per user, so a second
    // submission fails here rather than in a read-then-write race.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "You already have an application under review" },
        { status: 409 },
      );
    }
    console.error("[role-applications:POST]", error);
    return NextResponse.json({ error: "Could not submit your application" }, { status: 500 });
  }
}
