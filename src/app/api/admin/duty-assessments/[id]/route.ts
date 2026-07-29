import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { assessmentReviewSchema } from "@/lib/validations";

/** PATCH /api/admin/duty-assessments/[id] — verify or reject a submitted
 *  duty assessment. Only VERIFIED rows ever feed the landed-cost engine. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  try {
    const parsed = assessmentReviewSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const { action, rejectionReason } = parsed.data;

    const existing = await prisma.dutyAssessment.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const assessment = await prisma.dutyAssessment.update({
      where: { id: params.id },
      data: {
        status: action === "VERIFY" ? "VERIFIED" : "REJECTED",
        rejectionReason: action === "REJECT" ? rejectionReason || "Not specified" : null,
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
      select: { id: true, status: true },
    });

    return NextResponse.json({ success: true, status: assessment.status });
  } catch (error) {
    console.error("[admin/duty-assessments]", error);
    return NextResponse.json({ error: "Failed to update assessment" }, { status: 500 });
  }
}
