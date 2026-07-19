import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { verificationReviewSchema } from "@/lib/validations";

/**
 * PATCH — approve or reject a dealer verification. Admin only.
 * Approving flips the dealer's `verified` flag (the public trust badge).
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const parsed = verificationReviewSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid review" }, { status: 400 });
    }

    const verification = await prisma.dealerVerification.findUnique({
      where: { id: params.id },
      include: { dealer: { select: { id: true, userId: true, businessName: true } } },
    });
    if (!verification) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 });
    }

    const approved = parsed.data.action === "approve";

    await prisma.$transaction([
      prisma.dealerVerification.update({
        where: { id: verification.id },
        data: {
          status: approved ? "APPROVED" : "REJECTED",
          reviewNote: parsed.data.reviewNote || null,
          reviewedAt: new Date(),
        },
      }),
      prisma.dealer.update({
        where: { id: verification.dealer.id },
        data: { verified: approved },
      }),
    ]);

    await prisma.notification
      .create({
        data: {
          userId: verification.dealer.userId,
          type: "SYSTEM",
          title: approved ? "You're verified! ✅" : "Verification needs attention",
          body: approved
            ? `${verification.dealer.businessName} is now a verified dealer on CarVista.`
            : parsed.data.reviewNote || "Your verification was not approved. Please review and resubmit.",
          link: "/dashboard/dealer/verification",
        },
      })
      .catch(() => null);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin:verifications:PATCH]", error);
    return NextResponse.json({ error: "Could not update the verification" }, { status: 500 });
  }
}
