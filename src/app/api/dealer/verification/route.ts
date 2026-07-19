import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { rateLimit, getClientId } from "@/lib/rate-limit";
import { dealerVerificationSchema } from "@/lib/validations";

/**
 * POST — a dealer submits (or re-submits) their KYC for review.
 * Re-submitting resets the request to PENDING.
 */
export async function POST(req: Request) {
  const limit = rateLimit(`dealer-kyc:${getClientId(req)}`, 5, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  try {
    const dealer = await prisma.dealer.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!dealer) {
      return NextResponse.json({ error: "Only dealer accounts can verify." }, { status: 403 });
    }

    const parsed = dealerVerificationSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid submission" },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const data = {
      businessRegNumber: d.businessRegNumber,
      taxId: d.taxId || null,
      contactName: d.contactName,
      contactPhone: d.contactPhone,
      idType: d.idType,
      idNumber: d.idNumber,
      documentUrl: d.documentUrl || null,
      notes: d.notes || null,
      status: "PENDING" as const,
      reviewNote: null,
      reviewedAt: null,
      submittedAt: new Date(),
    };

    await prisma.dealerVerification.upsert({
      where: { dealerId: dealer.id },
      create: { dealerId: dealer.id, ...data },
      update: data,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[dealer:verification]", error);
    return NextResponse.json({ error: "Could not submit verification" }, { status: 500 });
  }
}
