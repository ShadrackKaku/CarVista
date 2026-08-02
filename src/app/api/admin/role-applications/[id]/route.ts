import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { roleApplicationReviewSchema } from "@/lib/validations";
import { isApplicableRole } from "@/lib/roles";
import { provisionRoleProfile } from "@/lib/provision-role";

/**
 * PATCH /api/admin/role-applications/[id] — approve or reject an application.
 *
 * Approving is the only thing in the system that raises an account's role, and
 * it happens here, behind the admin guard, from a role that was validated on the
 * way in and re-checked on the way out. The write is a transaction: a stored
 * decision without the role attached — or a role without the decision recorded —
 * would both be worse than failing.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const parsed = roleApplicationReviewSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid review" },
      { status: 400 },
    );
  }
  const { action, reviewNote } = parsed.data;

  try {
    const application = await prisma.roleApplication.findUnique({ where: { id: params.id } });
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    if (application.status !== "PENDING") {
      return NextResponse.json(
        { error: `This application was already ${application.status.toLowerCase()}` },
        { status: 409 },
      );
    }

    // Belt and braces: the submit route restricts the role, but this row could
    // have been written by a future code path, and granting is irreversible
    // from the applicant's side.
    if (action === "APPROVE" && !isApplicableRole(application.requestedRole)) {
      return NextResponse.json(
        { error: "That role cannot be granted through an application" },
        { status: 422 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.roleApplication.update({
        where: { id: application.id },
        data: {
          status: action === "APPROVE" ? "APPROVED" : "REJECTED",
          reviewerId: guard.user.id,
          reviewNote: reviewNote || null,
          reviewedAt: new Date(),
        },
      });

      if (action === "APPROVE") {
        await tx.user.update({
          where: { id: application.userId },
          data: { role: application.requestedRole },
        });
        // The role and the thing it operates are one decision. Granting DEALER
        // without a Dealer row leaves the console it unlocks with nothing to
        // read and no way to create one.
        await provisionRoleProfile(tx, application.userId, application.requestedRole, application);
      }
    });

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error("[admin:role-applications:PATCH]", error);
    return NextResponse.json({ error: "Could not record the decision" }, { status: 500 });
  }
}
