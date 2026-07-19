import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { reviewSchema } from "@/lib/validations";
import { rateLimit, getClientId } from "@/lib/rate-limit";
import type { Prisma } from "@prisma/client";

const TARGET_FIELD = {
  vehicle: "vehicleId",
  part: "partId",
  dealer: "dealerId",
  service: "serviceProviderId",
} as const;

/**
 * Resolve the owner (user id) of a review target, verifying it exists.
 * Returns `undefined` if the target doesn't exist, otherwise the owner's user
 * id (used to block self-reviews).
 */
async function getReviewTargetOwner(
  targetType: keyof typeof TARGET_FIELD,
  targetId: string,
): Promise<string | undefined> {
  switch (targetType) {
    case "vehicle": {
      const v = await prisma.vehicle.findUnique({ where: { id: targetId }, select: { sellerId: true } });
      return v?.sellerId;
    }
    case "part": {
      const p = await prisma.part.findUnique({ where: { id: targetId }, select: { sellerId: true } });
      return p?.sellerId;
    }
    case "dealer": {
      const d = await prisma.dealer.findUnique({ where: { id: targetId }, select: { userId: true } });
      return d?.userId;
    }
    case "service": {
      const s = await prisma.serviceProvider.findUnique({
        where: { id: targetId },
        select: { userId: true },
      });
      return s?.userId;
    }
  }
}

export async function POST(req: Request) {
  const limit = rateLimit(`review:${getClientId(req)}`, 10, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Please sign in to leave a review" }, { status: 401 });
  }

  try {
    const parsed = reviewSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid review" },
        { status: 400 },
      );
    }
    const { targetType, targetId, rating, title, comment } = parsed.data;
    const field = TARGET_FIELD[targetType];

    // The target must actually exist — don't let reviews attach to arbitrary
    // (or made-up) ids. For a dealer/service, also block self-reviews.
    const owner = await getReviewTargetOwner(targetType, targetId);
    if (owner === undefined) {
      return NextResponse.json({ error: "That item no longer exists." }, { status: 404 });
    }
    if (owner && owner === user.id) {
      return NextResponse.json({ error: "You can't review your own listing." }, { status: 403 });
    }

    // One review per user per target.
    const existing = await prisma.review.findFirst({
      where: { authorId: user.id, [field]: targetId },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You've already reviewed this. Thank you!" },
        { status: 409 },
      );
    }

    await prisma.review.create({
      data: {
        authorId: user.id,
        rating,
        title: title || null,
        comment,
        [field]: targetId,
      },
    });

    // Recompute the aggregate rating for targets that store one.
    if (targetType !== "vehicle") {
      const where = { [field]: targetId } as Prisma.ReviewWhereInput;
      const agg = await prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: true,
      });
      const data = {
        rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewCount: agg._count,
      };
      if (targetType === "part") await prisma.part.update({ where: { id: targetId }, data });
      if (targetType === "dealer") await prisma.dealer.update({ where: { id: targetId }, data });
      if (targetType === "service")
        await prisma.serviceProvider.update({ where: { id: targetId }, data });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[reviews:POST]", error);
    return NextResponse.json({ error: "Could not submit your review" }, { status: 500 });
  }
}
