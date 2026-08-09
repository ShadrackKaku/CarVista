import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-guard";
import type { Prisma } from "@prisma/client";

/** Recompute a target's cached rating/reviewCount after a review is removed. */
async function recompute(field: "partId" | "dealerId" | "serviceProviderId", id: string) {
  const where = { [field]: id } as Prisma.ReviewWhereInput;
  const agg = await prisma.review.aggregate({ where, _avg: { rating: true }, _count: true });
  const data = {
    rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
    reviewCount: agg._count,
  };
  if (field === "partId") await prisma.part.update({ where: { id }, data });
  if (field === "dealerId") await prisma.dealer.update({ where: { id }, data });
  if (field === "serviceProviderId") await prisma.serviceProvider.update({ where: { id }, data });
}

/** DELETE — remove a review (moderation) and refresh the target's aggregate. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requirePermission("reviews:moderate");
  if (error) return error;

  try {
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      select: { id: true, partId: true, dealerId: true, serviceProviderId: true },
    });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await prisma.review.delete({ where: { id: params.id } });

    if (review.partId) await recompute("partId", review.partId);
    if (review.dealerId) await recompute("dealerId", review.dealerId);
    if (review.serviceProviderId) await recompute("serviceProviderId", review.serviceProviderId);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[admin:reviews:DELETE]", e);
    return NextResponse.json({ error: "Could not delete review" }, { status: 500 });
  }
}
